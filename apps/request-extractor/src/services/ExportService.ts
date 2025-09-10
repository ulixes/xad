// Export service for different formats (JSON, HAR, cURL)
import { ExtractionSession, HTTPRequest, HTTPResponse, ExportFormat } from '../types/extraction';

export class ExportService {
  static async exportSession(session: ExtractionSession, format: ExportFormat): Promise<void> {
    let content: string;
    
    switch (format.format) {
      case 'json':
        content = this.exportAsJSON(session);
        break;
      case 'har':
        content = this.exportAsHAR(session);
        break;
      case 'curl':
        content = this.exportAsCurl(session);
        break;
      default:
        throw new Error(`Unsupported export format: ${format.format}`);
    }
    
    await this.downloadFile(content, format.filename, this.getContentType(format.format));
  }
  
  private static exportAsJSON(session: ExtractionSession): string {
    const exportData = {
      session: {
        id: session.id,
        url: session.url,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
        duration: session.endTime ? session.endTime - session.startTime : null,
        status: session.status
      },
      requestCount: session.requests.length,
      requests: session.requests.map(pair => ({
        request: {
          id: pair.request.id,
          method: pair.request.method,
          url: pair.request.url,
          headers: pair.request.headers,
          body: this.tryParseJSON(pair.request.body),
          timestamp: new Date(pair.request.timestamp).toISOString(),
          type: pair.request.requestType,
          ...(pair.request.requestType === 'GraphQL' && {
            graphql: {
              operationName: (pair.request as any).operationName,
              query: (pair.request as any).query,
              variables: (pair.request as any).variables
            }
          })
        },
        response: pair.response ? {
          status: pair.response.status,
          statusText: pair.response.statusText,
          headers: pair.response.headers,
          body: this.tryParseJSON(pair.response.body),
          timestamp: new Date(pair.response.timestamp).toISOString(),
          responseTime: `${pair.response.responseTime}ms`
        } : null
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  private static exportAsHAR(session: ExtractionSession): string {
    const harData = {
      log: {
        version: "1.2",
        creator: {
          name: "XAD Request Extractor",
          version: "1.0.0"
        },
        pages: [
          {
            startedDateTime: new Date(session.startTime).toISOString(),
            id: session.id,
            title: session.url,
            pageTimings: {}
          }
        ],
        entries: session.requests.map(pair => {
          const request = pair.request;
          const response = pair.response;
          
          return {
            pageref: session.id,
            startedDateTime: new Date(request.timestamp).toISOString(),
            time: response ? response.responseTime : 0,
            request: {
              method: request.method,
              url: request.url,
              httpVersion: "HTTP/1.1",
              headers: Object.entries(request.headers).map(([name, value]) => ({ name, value })),
              queryString: this.extractQueryString(request.url),
              cookies: [],
              headersSize: -1,
              bodySize: request.body ? request.body.length : 0,
              ...(request.body && {
                postData: {
                  mimeType: request.headers['content-type'] || 'application/octet-stream',
                  text: request.body
                }
              })
            },
            response: response ? {
              status: response.status,
              statusText: response.statusText,
              httpVersion: "HTTP/1.1",
              headers: Object.entries(response.headers).map(([name, value]) => ({ name, value })),
              cookies: [],
              content: {
                size: response.body ? response.body.length : 0,
                mimeType: response.headers['content-type'] || 'application/octet-stream',
                text: response.body || ''
              },
              redirectURL: "",
              headersSize: -1,
              bodySize: response.body ? response.body.length : 0
            } : {
              status: 0,
              statusText: "",
              httpVersion: "HTTP/1.1",
              headers: [],
              cookies: [],
              content: { size: 0, mimeType: "", text: "" },
              redirectURL: "",
              headersSize: -1,
              bodySize: 0
            },
            cache: {},
            timings: {
              send: 0,
              wait: response ? response.responseTime : 0,
              receive: 0
            }
          };
        })
      }
    };
    
    return JSON.stringify(harData, null, 2);
  }
  
  private static exportAsCurl(session: ExtractionSession): string {
    const curlCommands = session.requests.map(pair => {
      const request = pair.request;
      let curl = `curl -X ${request.method}`;
      
      // Add headers
      Object.entries(request.headers).forEach(([name, value]) => {
        curl += ` \\\n  -H "${name}: ${value}"`;
      });
      
      // Add body
      if (request.body) {
        curl += ` \\\n  -d '${request.body}'`;
      }
      
      // Add URL
      curl += ` \\\n  "${request.url}"`;
      
      return `# ${request.requestType} Request - ${new Date(request.timestamp).toISOString()}\n${curl}\n`;
    });
    
    return [
      `# Request/Response Export for Session: ${session.id}`,
      `# URL: ${session.url}`,
      `# Start Time: ${new Date(session.startTime).toISOString()}`,
      `# Total Requests: ${session.requests.length}`,
      '',
      ...curlCommands
    ].join('\n');
  }
  
  private static tryParseJSON(str?: string): any {
    if (!str) return null;
    
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }
  
  private static extractQueryString(url: string): Array<{name: string, value: string}> {
    try {
      const urlObj = new URL(url);
      const params = [];
      for (const [name, value] of urlObj.searchParams.entries()) {
        params.push({ name, value });
      }
      return params;
    } catch {
      return [];
    }
  }
  
  private static getContentType(format: string): string {
    switch (format) {
      case 'json':
      case 'har':
        return 'application/json';
      case 'curl':
        return 'text/plain';
      default:
        return 'text/plain';
    }
  }
  
  private static async downloadFile(content: string, filename: string, contentType: string): Promise<void> {
    try {
      // Convert content to base64 data URL for Chrome extension downloads
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      const dataUrl = `data:${contentType};base64,${base64Content}`;
      
      await browser.downloads.download({
        url: dataUrl,
        filename,
        saveAs: true
      });
      
      console.log(`📁 [ExportService] Downloaded file: ${filename}`);
    } catch (error) {
      console.error(`❌ [ExportService] Download failed:`, error);
      throw error;
    }
  }
}