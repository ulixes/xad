 import { InstagramMetadata, InstagramAccountType, BasePlatformMetadata } from '@/src/types';
  import editPageMapping from './ig/edit-page.json';
  import { handleExecuteAction } from '@/src/background/actionHandler';

  // Raw captured data interface
  interface RawInstagramData {
    id?: string;
    username?: string;
    full_name?: string;
    biography?: string;
    profile_pic_url?: string;
    is_private?: boolean;
    is_verified?: boolean;
    is_business_account?: boolean;
    account_type?: string;
  }

  // Insights data interface
  interface RawInsightsData {
    follower_count?: number;
    profile_visits_count?: number;
    bio_link_clicks?: number;
    views_current_period?: number;
    views_by_follow_type?: Array<{ value: number; dimension_values: string[] }>;
    reach_current_period?: number;
    total_interactions?: number;
    interacted_accounts_by_follow_type?: Array<{ value: number; dimension_values: string[] }>;
    accounts_engaged?: number;
    hourly_30_day?: Array<{ dimension_values: string[]; value: number }>;
    total_interactions_by_media_type?: Array<{ dimension_values: string[]; value: number }>;
    views_by_media_and_follow_types?: Array<{ dimension_values: string[]; value: number }>;
    messages_total_connections_unique?: number;
    messages_conversations_started?: number;
    daily_response_rate?: number;
    daily_response_time?: number;
    top_views_media?: any[];
    top_interacted_media?: any[];
    instagram_user_id?: string;
  }

  export default defineBackground(() => {
    // Extension icon click handler
    browser.action.onClicked.addListener((tab) => {
      browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
    });

    // Message listener for handling various extension actions
    browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      // Handle action execution
      if (message.type === 'executeAction') {
        const result = await handleExecuteAction(message.payload);
        sendResponse(result);
        return true; // Keep the message channel open for async response
      }
      
      // Handle Instagram account addition
      else if (message.type === "addIgAccount") {
        const { handle, accountId } = message;
        console.log("Adding Instagram account:", handle);

        const tab = await browser.tabs.create({ url: 'about:blank' });

        if (!tab.id) {
          console.error('Failed to create tab - no tab ID');
          browser.runtime.sendMessage({
            type: 'collectionError',
            payload: 'Failed to create browser tab for data collection',
            accountId: accountId
          });
          sendResponse({ success: false, error: 'Failed to create tab' });
          return;
        }

        try {
          await browser.debugger.attach({ tabId: tab.id }, '1.3');
          await browser.debugger.sendCommand({ tabId: tab.id }, 'Network.enable');
          const url = 'https://www.instagram.com/accounts/edit/';

          await new Promise(resolve => setTimeout(resolve, 1000));
          await browser.tabs.update(tab.id, { url });
          let capturedData: RawInstagramData = {};

          // Set up event listener for network responses
          const debuggerListener = (source: any, method: string, params: any) => {
            if (method === 'Network.responseReceived' && source.tabId === tab.id) {
              const { requestId, response, type } = params;
              const responseUrl = response?.url;

              // Handle GraphQL requests
              if (responseUrl && responseUrl.includes('graphql') && type === 'XHR') {
                browser.debugger.sendCommand(
                  { tabId: tab.id },
                  'Network.getRequestPostData',
                  { requestId },
                  (requestResult: any) => {
                    browser.debugger.sendCommand(
                      { tabId: tab.id },
                      'Network.getResponseBody',
                      { requestId },
                      (result: any) => {
                        if (result && result.body) {
                          try {
                            const json = JSON.parse(result.body);

                            // Handle PolarisSettingsElevationEditProfilePageQuery for user ID
                            if (requestResult && requestResult.postData &&
                                requestResult.postData.includes('fb_api_req_friendly_name=PolarisSettingsElevationEditProfilePageQuery')) {
                              if (json.data?.viewer?.user?.id) {
                                capturedData.id = json.data.viewer.user.id;
                                console.log('Captured user ID:', capturedData.id);
                              }
                            }

                            // Handle PolarisSettingsDesktopContainerQuery for privacy and verification
                            if (requestResult && requestResult.postData &&
                                requestResult.postData.includes('fb_api_req_friendly_name=PolarisSettingsDesktopContainerQuery')) {
                              if (json.data?.xdt__settings__get_screen_dependencies) {
                                const deps = json.data.xdt__settings__get_screen_dependencies;

                                // Extract privacy setting
                                if (deps.boolean_settings?.[0]?.value !== undefined) {
                                  capturedData.is_private = deps.boolean_settings[0].value;
                                }

                                // Extract verification status
                                if (deps.boolean_server_values?.[1]?.value !== undefined) {
                                  capturedData.is_verified = deps.boolean_server_values[1].value;
                                }

                                // Extract account type
                                if (deps.string_server_values?.[0]?.value) {
                                  capturedData.account_type = deps.string_server_values[0].value;
                                }

                                console.log('Captured settings data:', {
                                  is_private: capturedData.is_private,
                                  is_verified: capturedData.is_verified,
                                  account_type: capturedData.account_type
                                });
                              }
                            }
                          } catch (e) {
                            console.error('Error parsing GraphQL response:', e);
                          }
                        }
                      }
                    );
                  }
                );
              }

              // Handle web_form_data requests
              if (responseUrl && responseUrl.includes('/api/v1/accounts/edit/web_form_data/')) {
                browser.debugger.sendCommand(
                  { tabId: tab.id },
                  'Network.getResponseBody',
                  { requestId },
                  (result: any) => {
                    if (result && result.body) {
                      try {
                        const json = JSON.parse(result.body);
                        if (json.form_data) {
                          if (json.form_data.username) {
                            capturedData.username = json.form_data.username;
                          }
                          if (json.form_data.first_name) {
                            capturedData.full_name = json.form_data.first_name;
                          }
                          if (json.form_data.biography !== undefined) {
                            capturedData.biography = json.form_data.biography;
                          }
                          if (json.form_data.business_account !== undefined) {
                            capturedData.is_business_account = json.form_data.business_account;
                          }
                          if (json.form_data.profile_pic_url) {
                            capturedData.profile_pic_url = json.form_data.profile_pic_url;
                          }

                          console.log('Captured form data:', {
                            username: capturedData.username,
                            full_name: capturedData.full_name,
                            biography: capturedData.biography,
                            is_business_account: capturedData.is_business_account,
                            profile_pic_url: capturedData.profile_pic_url
                          });
                        }
                      } catch (e) {
                        console.error('Error parsing form data response:', e);
                      }
                    }
                  }
                );
              }
            }
          };

          browser.debugger.onEvent.addListener(debuggerListener);

          // Wait for page load and potential network activity
          await new Promise(resolve => setTimeout(resolve, 10000));

          console.log('Edit page data collected:', capturedData);

          // Validate that the collected username matches the provided handle
          if (capturedData.username && capturedData.username.toLowerCase() !== handle.toLowerCase()) {
            console.error('Handle validation failed:', {
              provided: handle,
              collected: capturedData.username
            });
            
            // Clean up
            browser.debugger.onEvent.removeListener(debuggerListener);
            await browser.debugger.detach({ tabId: tab.id });
            if (tab.id !== undefined) {
              await browser.tabs.remove(tab.id);
            }
            
            // Send error message with account ID
            browser.runtime.sendMessage({
              type: 'collectionError',
              payload: `Handle verification failed. The provided handle "${handle}" does not match the Instagram account "${capturedData.username}".`,
              accountId: accountId
            });
            
            sendResponse({ 
              success: false, 
              error: 'Handle verification failed',
              details: `The provided handle "${handle}" does not match the Instagram account "${capturedData.username}".`
            });
            return;
          }

          // Now navigate to insights page to collect additional metrics
          const insightsData: RawInsightsData = {};
          const insightsUrl = 'https://www.instagram.com/accounts/insights/?timeframe=30';
          
          console.log('Navigating to insights page...');
          await browser.tabs.update(tab.id, { url: insightsUrl });

          // Set up insights page listener
          const insightsListener = (source: any, method: string, params: any) => {
            if (method === 'Network.responseReceived' && source.tabId === tab.id) {
              const { requestId, response, type } = params;
              const responseUrl = response?.url;

              // Handle GraphQL requests for insights
              if (responseUrl && responseUrl.includes('graphql') && type === 'XHR') {
                browser.debugger.sendCommand(
                  { tabId: tab.id },
                  'Network.getRequestPostData',
                  { requestId },
                  (requestResult: any) => {
                    browser.debugger.sendCommand(
                      { tabId: tab.id },
                      'Network.getResponseBody',
                      { requestId },
                      (result: any) => {
                        if (result && result.body) {
                          try {
                            const json = JSON.parse(result.body);

                            // Capture follower count
                            if (requestResult?.postData?.includes('PolarisAccountInsightsFollowersQuery')) {
                              if (json.data?.userInfo?.follower_count !== undefined) {
                                insightsData.follower_count = json.data.userInfo.follower_count;
                                console.log('Captured follower count:', insightsData.follower_count);
                              }
                            }

                            // Capture profile visits and bio clicks - PolarisAccountInsightsProfileQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsProfileQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node) {
                                if (node.profile_visits_count?.results?.[0]?.value !== undefined) {
                                  insightsData.profile_visits_count = node.profile_visits_count.results[0].value;
                                }
                                if (node.bio_link_clicks?.results?.[0]?.value !== undefined) {
                                  insightsData.bio_link_clicks = node.bio_link_clicks.results[0].value;
                                }
                                console.log('Captured profile metrics:', {
                                  visits: insightsData.profile_visits_count,
                                  bio_clicks: insightsData.bio_link_clicks
                                });
                              }
                            }

                            // Capture views and reach metrics - PolarisAccountInsightsViewsQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsViewsQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node) {
                                if (node.views_current_period?.results?.[0]?.value !== undefined) {
                                  insightsData.views_current_period = node.views_current_period.results[0].value;
                                }
                                if (node.views_by_follow_type?.results) {
                                  insightsData.views_by_follow_type = node.views_by_follow_type.results;
                                }
                                if (node.reach_current_period?.results?.[0]?.value !== undefined) {
                                  insightsData.reach_current_period = node.reach_current_period.results[0].value;
                                }
                                console.log('Captured views/reach metrics:', {
                                  views: insightsData.views_current_period,
                                  reach: insightsData.reach_current_period
                                });
                              }
                            }

                            // Capture interactions - PolarisAccountInsightsInteractionsQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsInteractionsQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node) {
                                if (node.total_interactions?.results?.[0]?.value !== undefined) {
                                  insightsData.total_interactions = node.total_interactions.results[0].value;
                                }
                                if (node.engaged_accounts?.results?.[0]?.value !== undefined) {
                                  insightsData.accounts_engaged = node.engaged_accounts.results[0].value;
                                }
                                if (node.interacted_accounts_by_follow_type?.results) {
                                  insightsData.interacted_accounts_by_follow_type = node.interacted_accounts_by_follow_type.results;
                                }
                                console.log('Captured interaction metrics:', {
                                  total: insightsData.total_interactions,
                                  engaged: insightsData.accounts_engaged
                                });
                              }
                            }

                            // Capture message metrics - PolarisAccountInsightsConversationsQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsConversationsQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node) {
                                if (node.messages_total_connections_unique?.results?.[0]?.value !== undefined) {
                                  insightsData.messages_total_connections_unique = node.messages_total_connections_unique.results[0].value;
                                }
                                if (node.messages_conversations_started?.results?.[0]?.value !== undefined) {
                                  insightsData.messages_conversations_started = node.messages_conversations_started.results[0].value;
                                }
                                console.log('Captured message metrics');
                              }
                            }

                            // Capture message response metrics - PolarisAccountInsightsResponsivenessQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsResponsivenessQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node) {
                                if (node.daily_response_rate?.results?.[0]?.value !== undefined) {
                                  insightsData.daily_response_rate = node.daily_response_rate.results[0].value;
                                }
                                if (node.daily_response_time?.results?.[0]?.value !== undefined) {
                                  insightsData.daily_response_time = node.daily_response_time.results[0].value;
                                }
                                console.log('Captured response metrics');
                              }
                            }

                            // Capture views by content data - PolarisAccountInsightsViewsByContentDataQuery
                            if (requestResult?.postData?.includes('PolarisAccountInsightsViewsByContentDataQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node?.views_by_media_and_follow_types?.results) {
                                insightsData.views_by_media_and_follow_types = node.views_by_media_and_follow_types.results;
                                console.log('Captured views by media and follow types');
                              }
                              if (node?.total_interactions_by_media_type?.results) {
                                insightsData.total_interactions_by_media_type = node.total_interactions_by_media_type.results;
                                console.log('Captured interactions by media type');
                              }
                            }

                            // Capture activity times
                            if (requestResult?.postData?.includes('PolarisAccountInsightFollowersActiveTimesChartQuery')) {
                              const node = json.data?.user?.business_manager?.account_insights_node;
                              if (node?.hourly_30_day?.results) {
                                insightsData.hourly_30_day = node.hourly_30_day.results;
                                console.log('Captured activity times data');
                              }
                            }

                            // Capture top content by views
                            if (requestResult?.postData?.includes('PolarisAccountInsightsTopContentByViewsQuery')) {
                              const topViews = json.data?.user?.business_manager?.top_views_media;
                              if (topViews?.nodes) {
                                insightsData.top_views_media = topViews.nodes;
                                console.log('Captured top views content');
                              }
                            }

                            // Capture top content by interactions
                            if (requestResult?.postData?.includes('PolarisAccountInsightsTopContentByInteractionsQuery')) {
                              const topInteracted = json.data?.user?.business_manager?.top_interacted_media;
                              if (topInteracted?.nodes) {
                                insightsData.top_interacted_media = topInteracted.nodes;
                                console.log('Captured top interacted content');
                              }
                            }

                            // Capture Instagram user ID
                            if (json.data?.user?.id) {
                              insightsData.instagram_user_id = json.data.user.id;
                            }

                          } catch (e) {
                            console.error('Error parsing insights response:', e);
                          }
                        }
                      }
                    );
                  }
                );
              }
            }
          };

          // Remove old listener and add insights listener
          browser.debugger.onEvent.removeListener(debuggerListener);
          browser.debugger.onEvent.addListener(insightsListener);

          // Wait for insights page to load and fetch data
          await new Promise(resolve => setTimeout(resolve, 12000));

          console.log('Insights data collected:', insightsData);

          // Clean up
          browser.debugger.onEvent.removeListener(insightsListener);
          await browser.debugger.detach({ tabId: tab.id });
          if (tab.id !== undefined) {
            await browser.tabs.remove(tab.id);
          }

          // Build InstagramMetadata structure
          const metadata: InstagramMetadata = {
            // Profile data (from edit page)
            profile: {
              fullName: capturedData.full_name,
              followerCount: insightsData.follower_count || 0,
              followingCount: 0, // TODO: Capture from profile page
              postCount: 0, // TODO: Capture from profile page
              isVerified: capturedData.is_verified || false,
              accountType: mapAccountTypeString(capturedData.account_type),
              category: undefined, // TODO: Capture from business settings
              biography: capturedData.biography,
              profilePicUrl: capturedData.profile_pic_url,
              isPrivate: capturedData.is_private,
              isBusinessAccount: capturedData.is_business_account,
              isProfessional: capturedData.account_type === 'media_creator' || capturedData.is_business_account,
              externalUrl: undefined, // TODO: Extract from biography
              locationCountry: undefined, // TODO: Capture from profile
              locationCity: undefined, // TODO: Capture from profile
              mediaCount: undefined // TODO: Capture from profile
            },
            
            // Insights data (optional - only for business/creator accounts)
            insights: undefined,
            
            // Metadata
            lastCollectedAt: new Date().toISOString(),
            collectionErrors: [],
            rawData: {
              editPage: capturedData,
              insightsPage: insightsData
            }
          };

          // Add insights if we have data and it's a professional account
          if (Object.keys(insightsData).length > 0 && 
              (capturedData.is_business_account || capturedData.account_type === 'media_creator')) {
            
            // Calculate derived metrics
            const engagementRate = insightsData.views_current_period && insightsData.total_interactions
              ? (insightsData.total_interactions / insightsData.views_current_period) * 100
              : undefined;
            
            // Parse content type performance
            const contentTypePerformance = insightsData.total_interactions_by_media_type?.map(item => ({
              mediaType: mapMediaType(item.dimension_values[0]),
              interactions: item.value
            }));
            
            // Calculate video content ratio
            const videoInteractions = insightsData.total_interactions_by_media_type?.find(
              m => m.dimension_values[0] === '2' || m.dimension_values[0] === '16' // 2=video, 16=reel
            )?.value || 0;
            const totalContentInteractions = insightsData.total_interactions || 1;
            const videoContentRatio = (videoInteractions / totalContentInteractions) * 100;
            
            metadata.insights = {
              profileVisits: {
                thirtyDays: insightsData.profile_visits_count
              },
              accountsReached: {
                thirtyDays: insightsData.reach_current_period
              },
              accountsEngaged: {
                thirtyDays: insightsData.accounts_engaged
              },
              followerGrowth: {
                // TODO: Calculate from historical data
              },
              engagementRate,
              videoContentRatio,
              contentTypePerformance,
              contentEngagementTrend: insightsData.top_interacted_media?.map(media => ({
                postId: media.id,
                engagementValue: media.engagement || 0
              })),
              // Demographics - TODO: Capture from audience insights
              audienceGender: undefined,
              audienceAge: undefined,
              topLocations: undefined
            };
          } else if (!capturedData.is_business_account && capturedData.account_type !== 'media_creator') {
            metadata.collectionErrors?.push('Insights data not available for personal accounts');
          }

          if (Object.keys(capturedData).length === 0 && Object.keys(insightsData).length === 0) {
            browser.runtime.sendMessage({
              type: 'collectionError',
              payload: 'No profile or insights data found',
              accountId: accountId
            });
          }

          // Store the metadata if we have any data
          if (Object.keys(metadata).length > 0) {
            console.log('Instagram metadata collected:', metadata);
            
            // Send the collected data back to the side panel with account ID
            browser.runtime.sendMessage({
              type: 'igDataCollected',
              payload: metadata,
              accountId: accountId
            });
          }

          sendResponse({ success: true, handle, data: metadata });
        } catch (error: any) {
          console.error('Debugger error:', error);
          
          // More detailed error message based on error type
          let errorMessage = 'Failed to collect data';
          if (error.message?.includes('Cannot access') || error.message?.includes('attach')) {
            errorMessage = 'Unable to attach debugger. Please check browser permissions.';
          } else if (error.message?.includes('Cannot read properties')) {
            errorMessage = 'Data collection failed. Instagram page structure may have changed.';
          } else if (error.message) {
            errorMessage = `Collection error: ${error.message}`;
          }
          
          browser.runtime.sendMessage({
            type: 'collectionError',
            payload: errorMessage,
            accountId: accountId
          });
          
          // Clean up: detach debugger if attached and close tab
          try {
            if (tab.id !== undefined) {
              await browser.debugger.detach({ tabId: tab.id });
            }
          } catch (detachError) {
            console.log('Debugger already detached or not attached');
          }
          
          if (tab.id !== undefined) {
            try {
              await browser.tabs.remove(tab.id);
            } catch (removeError) {
              console.log('Tab already closed');
            }
          }
          
          sendResponse({ success: false, error: errorMessage });
        }

        return true;
      }
      
      // Handle TikTok account addition
      else if (message.type === "addTikTokAccount") {
        const { handle, accountId } = message;
        console.log("🚀 STARTING TIKTOK ACCOUNT ADDITION FOR:", handle);
        console.log("Account ID:", accountId);
        
        try {
          // GO DIRECTLY TO TIKTOK STUDIO - THIS IS WHERE THE DATA IS!
          const studioUrl = `https://www.tiktok.com/tiktokstudio/analytics/overview?tiktok_collect=true&account_id=${accountId}&handle=${handle}`;
          console.log("📍 NAVIGATING TO TIKTOK STUDIO:", studioUrl);
          
          const tab = await browser.tabs.create({ url: studioUrl });
          console.log('✅ Opened TikTok Studio with collection params in URL');
          console.log('Tab ID:', tab.id);
          
          // METHOD 2: Also send message as backup after a delay
          setTimeout(async () => {
            try {
              await browser.tabs.sendMessage(tab.id!, {
                type: 'COLLECT_TIKTOK_DATA',
                accountId: accountId,
                handle: handle
              });
              console.log('Also sent collection message to content script');
            } catch (e) {
              console.log('Message send failed (expected if already collecting):', e);
            }
          }, 2000);
          
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error adding TikTok account:', error);
          sendResponse({ success: false, error: error.message });
        }
        
        return true;
      }
      
      // Handle TikTok data collection response
      else if (message.type === "TIKTOK_DATA_COLLECTED") {
        const { accountId, handle, payload } = message;
        console.log("TikTok data collected:", payload, "for account:", accountId);
        
        // Send the collected data back to the side panel
        browser.runtime.sendMessage({
          type: 'tiktokDataCollected',
          payload: payload,
          accountId: accountId,
          handle: handle
        });
        
        // Close the tab if it's still open
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
        
        return true;
      }
      
      // Handle navigation to TikTok Studio
      else if (message.type === "NAVIGATE_TO_STUDIO") {
        const { accountId, handle } = message;
        
        if (sender.tab?.id) {
          // Navigate current tab to TikTok Studio
          await browser.tabs.update(sender.tab.id, {
            url: 'https://www.tiktok.com/tiktokstudio/analytics/overview'
          });
          
          // Wait and re-send collection message
          setTimeout(async () => {
            await browser.tabs.sendMessage(sender.tab.id!, {
              type: 'COLLECT_TIKTOK_DATA',
              accountId: accountId,
              handle: handle
            });
          }, 3000);
        }
        
        return true;
      }
    });
  });

  // Map account_type number to enum
  function mapAccountType(typeNum: number): InstagramAccountType {
    switch (typeNum) {
      case 1: return InstagramAccountType.PERSONAL;
      case 2: return InstagramAccountType.BUSINESS;
      case 3: return InstagramAccountType.CREATOR;
      default: return InstagramAccountType.PERSONAL;
    }
  }

  // Map account_type string to enum
  function mapAccountTypeString(typeStr: string | undefined): InstagramAccountType {
    if (!typeStr) return InstagramAccountType.PERSONAL;

    switch (typeStr.toLowerCase()) {
      case 'media_creator': return InstagramAccountType.CREATOR;
      case 'business': return InstagramAccountType.BUSINESS;
      case 'personal': return InstagramAccountType.PERSONAL;
      default: return InstagramAccountType.PERSONAL;
    }
  }

  // Map media type dimension value to readable string
  function mapMediaType(dimensionValue: string): string {
    switch (dimensionValue) {
      case '1': return 'photo';
      case '2': return 'video';
      case '3': return 'carousel';
      case '16': return 'reel';
      default: return 'unknown';
    }
  }
