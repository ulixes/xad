// Tab management utilities for MV3 background script
export class TabManager {
  private static activeVerifications = new Map<number, string>(); // tabId -> username
  
  static async createVerificationTab(platform: string, username: string): Promise<number> {
    const profileUrl = this.getProfileUrl(platform, username);
    console.log(`🌐 [TabManager] Creating tab for URL: ${profileUrl}`);
    
    try {
      const tab = await browser.tabs.create({
        url: profileUrl,
        active: false, // Use offscreen/headless verification
      });
      
      if (!tab.id) {
        throw new Error('Failed to create verification tab - no tab ID');
      }
      
      this.activeVerifications.set(tab.id, username);
      console.log(`📱 [TabManager] Created verification tab with ID: ${tab.id}`);
      
      return tab.id;
    } catch (error) {
      console.error(`❌ [TabManager] Failed to create tab:`, error);
      throw new Error(`Failed to create verification tab: ${error}`);
    }
  }
  
  static async waitForTabToLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const listener = (id: number, changeInfo: any) => {
        if (id === tabId && changeInfo.status === 'complete') {
          browser.tabs.onUpdated.removeListener(listener);
          // Give JavaScript time to execute
          setTimeout(resolve, 1000);
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }
  
  static async closeTab(tabId: number): Promise<void> {
    try {
      await browser.tabs.remove(tabId);
      this.activeVerifications.delete(tabId);
      console.log(`🗑️ [TabManager] Successfully closed tab: ${tabId}`);
    } catch (error) {
      console.warn(`⚠️ [TabManager] Error closing tab ${tabId}:`, error);
      // Don't throw - tab might already be closed
    }
  }
  
  static getUsername(tabId: number): string | undefined {
    return this.activeVerifications.get(tabId);
  }
  
  static cleanup(): void {
    // Close all verification tabs
    for (const tabId of this.activeVerifications.keys()) {
      this.closeTab(tabId).catch(console.warn);
    }
    this.activeVerifications.clear();
  }
  
  private static getProfileUrl(platform: string, username: string): string {
    switch (platform.toLowerCase()) {
      case 'instagram':
        console.log(`🔗 [TabManager] Instagram URL construction for username: "${username}"`);
        const url = `https://www.instagram.com/${username}/`;
        console.log(`🔗 [TabManager] Final URL: ${url}`);
        return url;
      case 'twitter':
      case 'x':
        return `https://x.com/${username}`;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}