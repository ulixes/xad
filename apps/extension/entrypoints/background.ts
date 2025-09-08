// src/background.ts

// A list of URL patterns that should trigger network interception.
const URL_PATTERNS_TO_WATCH = [
    /https:\/\/x\.com\/[^/]+\/likes/,
    /https:\/\/x\.com\/[^/]+\/(with_replies)?$/,
    // Add other patterns for Farcaster, etc. here
];

export default defineBackground(() => {
    const attachedTabs = new Set<number>();

    // main event
    browser.action.onClicked.addListener((tab) => {
        browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
    });

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status !== 'complete' || !tab.url) return;

        const shouldAttach = URL_PATTERNS_TO_WATCH.some(pattern => pattern.test(tab.url!));

        if (shouldAttach && !attachedTabs.has(tabId)) {
            browser.debugger.attach({ tabId }, "1.3", () => {
                if (browser.runtime.lastError) {
                    console.error("Debugger attach failed:", browser.runtime.lastError.message);
                    return;
                }
                attachedTabs.add(tabId);
                browser.debugger.sendCommand({ tabId }, "Network.enable");
                console.log(`Debugger attached to tab ${tabId} for URL: ${tab.url}`);
            });
        }
    });

    browser.debugger.onEvent.addListener((source, method, params: any) => {
        if (method !== "Network.responseReceived" || !source.tabId) return;

        browser.debugger.sendCommand(
            { tabId: source.tabId },
            "Network.getResponseBody",
            { requestId: params.requestId },
            (response) => {
                if (response?.body) {
                    // Send the raw data via an internal command.
                    sendEventUpTheChain({
                        sourceUrl: params.response.url,
                        responseBody: response.body,
                    });
                }
            }
        );
    });
    
    browser.tabs.onRemoved.addListener((tabId) => {
        if (attachedTabs.has(tabId)) {
            browser.debugger.detach({ tabId });
            attachedTabs.delete(tabId);
        }
    });
});

/**
 * Sends the captured network event to other parts of the extension 
 * (like the side panel or popup) using an internal command.
 */
function sendEventUpTheChain(payload: { sourceUrl: string; responseBody: string; }) {
    console.log(`Sending command up the chain for: ${payload.sourceUrl}`);
    
    // This sends a message that your app's UI layer can listen for.
    browser.runtime.sendMessage({
        type: "RAW_NETWORK_EVENT",
        payload: payload
    }).catch(error => {
        // This error is common and usually just means the side panel isn't open to receive the message.
        console.warn("Could not send message command. Is the side panel open?", error);
    });
}