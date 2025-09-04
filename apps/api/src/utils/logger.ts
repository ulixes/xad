interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  component?: string;
  function?: string;
  line?: number;
  file?: string;
  traceId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  service?: string;
  environment?: string;
  version?: string;
  context?: LogContext;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    type?: string;
    status?: number;
    code?: string;
    cause?: any;
  };
  metadata?: {
    nodeVersion?: string;
    processId?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    uptime?: number;
  };
}

class Logger {
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor(serviceName = 'xad-api', environment = 'production', version = '1.0.0') {
    this.serviceName = serviceName;
    this.environment = environment;
    this.version = version;
  }

  private getCallerInfo(): { file: string; function: string; line: number } {
    const stack = new Error().stack;
    if (!stack) return { file: 'unknown', function: 'unknown', line: 0 };

    const stackLines = stack.split('\n');
    // Skip: Error, getCallerInfo, formatLog, and the actual log method
    const callerLine = stackLines[4] || stackLines[3] || stackLines[2];
    
    const match = callerLine.match(/at\s+(.+?)\s+\((.+):(\d+):\d+\)/);
    if (match) {
      return {
        function: match[1] || 'anonymous',
        file: match[2]?.split('/').pop() || 'unknown',
        line: parseInt(match[3]) || 0
      };
    }

    // Fallback for different stack trace formats
    const simpleMatch = callerLine.match(/at\s+(.+):(\d+):\d+/);
    if (simpleMatch) {
      return {
        function: 'unknown',
        file: simpleMatch[1]?.split('/').pop() || 'unknown',
        line: parseInt(simpleMatch[2]) || 0
      };
    }

    return { file: 'unknown', function: 'unknown', line: 0 };
  }

  private formatLog(level: LogEntry['level'], message: string, context?: LogContext, error?: Error): LogEntry {
    const timestamp = new Date().toISOString();
    const caller = this.getCallerInfo();
    
    const logEntry: LogEntry = {
      level,
      timestamp,
      message,
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      context: {
        ...context,
        file: caller.file,
        function: caller.function,
        line: caller.line,
      },
      metadata: {
        runtime: 'cloudflare-workers',
      }
    };

    if (error) {
      // Enhanced error parsing
      const errorInfo: any = {
        name: error.name,
        message: error.message,
        stack: this.environment === 'development' ? error.stack?.split('\n') : undefined,
        type: (error as any).type,
        status: (error as any).status,
        code: (error as any).code || (error as any).errno,
        cause: (error as any).cause,
      };

      // Add HTTP-specific error details
      if ((error as any).response) {
        errorInfo.httpResponse = {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          headers: (error as any).response.headers,
        };
      }

      // Add database-specific error details
      if ((error as any).detail || (error as any).constraint) {
        errorInfo.database = {
          detail: (error as any).detail,
          constraint: (error as any).constraint,
          table: (error as any).table,
          column: (error as any).column,
        };
      }

      logEntry.error = errorInfo;
    }

    return logEntry;
  }

  private log(entry: LogEntry) {
    if (this.environment === 'development') {
      const level = entry.level.toUpperCase().padEnd(5);
      const time = new Date(entry.timestamp).toISOString();
      const id = entry.context?.requestId || 'main';
      
      // Clean professional format with location
      const location = `${entry.context?.file}:${entry.context?.line}`;
      let logLine = `[${time}] ${level} [${id}] ${entry.message} | ${location}`;
      
      // Add essential context
      if (entry.context?.endpoint) {
        logLine += ` | ${entry.context.method} ${entry.context.endpoint}`;
      }
      if (entry.context?.userId) {
        logLine += ` | user=${entry.context.userId}`;
      }
      if (entry.context?.duration) {
        logLine += ` | ${entry.context.duration}ms`;
      }
      
      console.log(logLine);
      
      // Show app ID mismatch details
      if (entry.context?.tokenAudience && entry.context?.serverAppId) {
        console.log(`       token_app_id=${entry.context.tokenAudience}`);
        console.log(`       server_app_id=${entry.context.serverAppId}`);
      }
      
      // Show error details
      if (entry.error && entry.level === 'error') {
        console.error(`       error_type=${entry.error.type || entry.error.name}`);
        console.error(`       error_msg="${entry.error.message}"`);
        if (entry.error.status) console.error(`       status=${entry.error.status}`);
        
        // Show first troubleshooting hint
        if (entry.context?.troubleshooting) {
          const firstHint = Object.values(entry.context.troubleshooting)[0];
          console.error(`       hint: ${firstHint}`);
        }
      }
    } else {
      // Structured JSON for production
      console.log(JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        location: `${entry.context?.file}:${entry.context?.line}`,
        request_id: entry.context?.requestId,
        endpoint: entry.context?.endpoint,
        method: entry.context?.method,
        user_id: entry.context?.userId,
        duration_ms: entry.context?.duration,
        error: entry.error ? {
          type: entry.error.type,
          message: entry.error.message,
          status: entry.error.status
        } : undefined,
        service: entry.service,
        version: entry.version
      }));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(this.formatLog('debug', message, context));
  }

  info(message: string, context?: LogContext) {
    this.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.log(this.formatLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(this.formatLog('error', message, context, error));
  }

  // Specialized logging methods for different scenarios

  // HTTP Request/Response logging
  httpRequest(requestId: string, method: string, url: string, userAgent?: string, ip?: string) {
    this.info('HTTP request received', {
      requestId,
      method,
      endpoint: url,
      userAgent,
      ip,
      component: 'http-server'
    });
  }

  httpResponse(requestId: string, statusCode: number, duration: number, responseSize?: number) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(this.formatLog(level, 'HTTP response sent', {
      requestId,
      statusCode,
      duration,
      responseSize,
      component: 'http-server'
    }));
  }

  // Auth-specific logging methods
  authStart(requestId: string, endpoint: string, method: string, userAgent?: string, ip?: string) {
    this.info('Authentication started', {
      requestId,
      endpoint,
      method,
      userAgent,
      ip,
      component: 'auth-middleware'
    });
  }

  authTokenReceived(requestId: string, tokenLength: number, tokenPreview: string) {
    this.debug('Auth token received and parsed', {
      requestId,
      tokenLength,
      tokenPreview,
      component: 'auth-middleware'
    });
  }

  authPrivyCall(requestId: string, appId: string, tokenLength: number) {
    this.debug('Calling Privy verifyAuthToken', {
      requestId,
      appId,
      tokenLength,
      component: 'privy-api-call'
    });
  }

  authSuccess(requestId: string, userId: string, duration: number, walletCount: number, email?: string) {
    this.info('Authentication successful', {
      requestId,
      userId,
      email,
      duration,
      walletCount,
      component: 'auth-middleware'
    });
  }

  authFailure(requestId: string, error: Error, duration: number, tokenLength?: number, appId?: string) {
    this.error('Authentication failed', {
      requestId,
      duration,
      tokenLength,
      appId,
      component: 'auth-middleware',
      troubleshooting: {
        checkAppId: 'Verify Privy app ID format (should start with clp-)',
        checkToken: 'Verify token is valid and not expired',
        checkConfig: 'Verify PRIVY_APP_ID and PRIVY_APP_SECRET are set correctly'
      }
    }, error);
  }

  privyConfig(appId: string, hasSecret: boolean, environment: string = this.environment) {
    this.info('Privy configuration loaded', {
      appId,
      hasSecret,
      environment,
      component: 'privy-init'
    });
  }

  privyInitSuccess(appId: string, appIdPrefix: string) {
    this.info('Privy client initialized successfully', {
      appId,
      appIdPrefix,
      isValidFormat: appIdPrefix === 'clp',
      component: 'privy-init'
    });
  }

  privyInitFailure(error: Error, appId?: string) {
    this.error('Privy client initialization failed', {
      appId,
      component: 'privy-init',
      troubleshooting: {
        checkCredentials: 'Verify PRIVY_APP_ID and PRIVY_APP_SECRET in .env.local',
        checkFormat: 'Privy app ID should start with "clp-"',
        checkDashboard: 'Get correct credentials from Privy dashboard'
      }
    }, error);
  }

  // Database logging
  dbQuery(requestId: string, query: string, params?: any[], duration?: number) {
    this.debug('Database query executed', {
      requestId,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      paramCount: params?.length,
      duration,
      component: 'database'
    });
  }

  dbError(requestId: string, error: Error, query?: string, params?: any[]) {
    this.error('Database query failed', {
      requestId,
      query: query?.substring(0, 100) + (query && query.length > 100 ? '...' : ''),
      paramCount: params?.length,
      component: 'database'
    }, error);
  }

  // API endpoint logging
  apiCall(requestId: string, endpoint: string, method: string, userId?: string, params?: any) {
    this.info('API endpoint called', {
      requestId,
      endpoint,
      method,
      userId,
      hasParams: !!params,
      component: 'api-handler'
    });
  }

  apiResponse(requestId: string, statusCode: number, duration: number, dataSize?: number) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(this.formatLog(level, 'API response sent', {
      requestId,
      statusCode,
      duration,
      dataSize,
      component: 'api-handler'
    }));
  }

  // Business logic logging
  userCreated(requestId: string, userId: string, privyId: string) {
    this.info('New user created in database', {
      requestId,
      userId,
      privyId,
      component: 'user-service'
    });
  }

  userLogin(requestId: string, userId: string, source: string = 'web') {
    this.info('User logged in', {
      requestId,
      userId,
      source,
      component: 'auth-service'
    });
  }

  businessLogicError(requestId: string, operation: string, error: Error, context?: any) {
    this.error(`Business logic error in ${operation}`, {
      requestId,
      operation,
      component: 'business-logic',
      ...context
    }, error);
  }

  // Performance monitoring
  performanceWarning(requestId: string, operation: string, duration: number, threshold: number = 1000) {
    if (duration > threshold) {
      this.warn(`Slow operation detected`, {
        requestId,
        operation,
        duration,
        threshold,
        component: 'performance-monitor'
      });
    }
  }

  // Security logging
  securityAlert(requestId: string, alertType: string, details: any, ip?: string, userAgent?: string) {
    this.error('Security alert', {
      requestId,
      alertType,
      ip,
      userAgent,
      component: 'security-monitor',
      ...details
    });
  }
}

export const logger = new Logger();
export type { LogContext };