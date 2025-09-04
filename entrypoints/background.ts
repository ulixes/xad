import { LikesResponse, NormalizedMedia, NormalizedUser, FlatTweet, VideoVariant } from "@/src/types";

export default defineBackground(() => {
  const attachedTabs = new Set<number>();

  // Keep the last seen liker
  let currentLiker: NormalizedUser | null = null;

  browser.action.onClicked.addListener((tab) => {
    browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
  });

  const filter: Browser.webRequest.RequestFilter = {
    urls: ["https://x.com/i/api/graphql/*"],
    types: ["xmlhttprequest"]
  };

  browser.webRequest.onCompleted.addListener(
    (details) => {
      if (details.url.includes("Likes")) {
        browser.runtime.sendMessage({ type: "user-opened-likes-view" });
      }
    },
    filter
  );

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.status === "complete" &&
      tab.url?.match(/https:\/\/x\.com\/[^/]+\/likes/) &&
      !attachedTabs.has(tabId)
    ) {
      browser.debugger.attach({ tabId }, "1.3", () => {
        if (browser.runtime.lastError) {
          console.error("Debugger attach failed:", browser.runtime.lastError.message);
          return;
        }
        attachedTabs.add(tabId);
        browser.debugger.sendCommand({ tabId }, "Network.enable");
      });
    }
  });

  browser.debugger.onEvent.addListener((source, method, params: any) => {
    if (method !== "Network.responseReceived") return;
    const url = params.response.url;

    // Step 1: Capture liker (ProfileSpotlightsQuery)
    if (url.includes("ProfileSpotlightsQuery")) {
      browser.debugger.sendCommand(
        { tabId: source.tabId },
        "Network.getResponseBody",
        { requestId: params.requestId },
        (response) => {
          if (!response?.body) return;
          try {
            const data = JSON.parse(response.body);
            currentLiker = parseLikerResponse(data);
            browser.runtime.sendMessage({ type: "user-opened-x-profile", user: currentLiker });
            console.log("Parsed liker:", currentLiker);
          } catch (err) {
            console.error("Error parsing liker response", err);
          }
        }
      );
    }

    // Step 2: Capture liked tweets
    if (url.includes("Likes")) {
      browser.debugger.sendCommand(
        { tabId: source.tabId },
        "Network.getResponseBody",
        { requestId: params.requestId },
        (response) => {
          if (!response?.body) return;
          try {
            const data = JSON.parse(response.body);
            const tweets = parseTweetsResponse(data);
            const processed: LikesResponse = {
              liker: currentLiker!, // use the stored liker
              tweets
            };
            console.log("Parsed LikesResponse:", processed);
            browser.storage.local.set({ lastGraphQLResponse: processed });
            browser.runtime.sendMessage({ type: "proof", proof: processed });
          } catch (err) {
            console.error("Error parsing likes response", err);
          }
        }
      );
    }
  });

  // --- Parsing functions ---

  function parseLikerResponse(raw: any): NormalizedUser {
    const user = raw?.data?.user_result_by_screen_name?.result;
    return {
      id: user?.rest_id,
      name: user?.core?.name,
      handle: user?.core?.screen_name,
      avatar: user?.legacy?.profile_image_url_https,
      verified: user?.is_blue_verified || user?.legacy?.verified,
      followers: user?.legacy?.followers_count,
      following: user?.legacy?.friends_count,
      createdAt: user?.legacy?.created_at
    };
  }

  function parseTweetsResponse(raw: any): FlatTweet[] {
    const tweets: FlatTweet[] = [];
    const instructions = raw?.data?.user?.result?.timeline?.timeline?.instructions ?? [];
    for (const instruction of instructions) {
      for (const entry of instruction.entries ?? []) {
        const tweet = entry?.content?.itemContent?.tweet_results?.result;
        if (!tweet || tweet.__typename !== "Tweet") continue;

        const author = tweet.core?.user_results?.result;
        if (!author) continue;

        const normalizedAuthor: NormalizedUser = {
          id: author.rest_id,
          name: author.legacy?.name,
          handle: author.legacy?.screen_name,
          avatar: author.legacy?.profile_image_url_https,
          verified: author.is_blue_verified || author.legacy?.verified,
          followers: author.legacy?.followers_count,
          following: author.legacy?.friends_count,
          createdAt: author.legacy?.created_at
        };

        tweets.push({
          id: tweet.rest_id,
          text: tweet.legacy?.full_text,
          createdAt: tweet.legacy?.created_at,
          lang: tweet.legacy?.lang,
          stats: {
            likes: tweet.legacy?.favorite_count,
            retweets: tweet.legacy?.retweet_count,
            replies: tweet.legacy?.reply_count,
            quotes: tweet.legacy?.quote_count,
            bookmarks: tweet.legacy?.bookmark_count,
            views: tweet.views?.count
          },
          media: extractMedia(tweet),
          author: normalizedAuthor
        });
      }
    }
    return tweets;
  }

  function extractMedia(tweet: any): NormalizedMedia[] {
    const media = tweet.legacy?.extended_entities?.media ?? tweet.legacy?.entities?.media ?? [];
    return media.map((m: any): NormalizedMedia => ({
      id: m.id_str,
      type: m.type,
      url: m.media_url_https,
      displayUrl: m.display_url,
      expandedUrl: m.expanded_url,
      videoVariants: m.video_info?.variants?.map((v: any): VideoVariant => ({
        bitrate: v.bitrate,
        contentType: v.content_type,
        url: v.url
      }))
    }));
  }

  browser.tabs.onRemoved.addListener((tabId) => {
    if (attachedTabs.has(tabId)) {
      browser.debugger.detach({ tabId }, () => {
        attachedTabs.delete(tabId);
      });
    }
  });
});
