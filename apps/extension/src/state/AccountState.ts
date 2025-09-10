import { ProfileData } from '../types/verification';
import { VerificationService } from '../services/VerificationService';

export type AccountStatus = 'verifying' | 'retrying' | 'verified' | 'failed';

export interface AccountData {
  id: string;
  platform: string;
  handle: string;
  status: AccountStatus;
  availableActions: number;
  maxActions: number;
  profileData?: ProfileData;
  verificationError?: string;
  retryCount: number;
  maxRetries: number;
}

export type AccountStateCallback = (account: AccountData) => void;

export class AccountState {
  private accounts: Map<string, AccountData> = new Map();
  private callbacks: Set<AccountStateCallback> = new Set();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.accounts = new Map();
    this.callbacks = new Set();
    this.retryTimeouts = new Map();
  }

  addAccount(id: string, platform: string, handle: string): void {
    const account: AccountData = {
      id,
      platform,
      handle,
      status: 'verifying',
      availableActions: 0,
      maxActions: 5,
      retryCount: 0,
      maxRetries: 3,
    };
    
    this.accounts.set(id, account);
    this.notifyCallbacks(account);
    this.startVerification(id);
  }

  removeAccount(id: string): void {
    this.clearRetryTimeout(id);
    this.accounts.delete(id);
  }

  getAccount(id: string): AccountData | undefined {
    return this.accounts.get(id);
  }

  getAllAccounts(): AccountData[] {
    return Array.from(this.accounts.values());
  }

  subscribe(callback: AccountStateCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  consumeAction(id: string): boolean {
    const account = this.accounts.get(id);
    if (!account || account.status !== 'verified' || account.availableActions <= 0) {
      return false;
    }

    account.availableActions = Math.max(0, account.availableActions - 1);
    this.accounts.set(id, account);
    this.notifyCallbacks(account);
    return true;
  }

  refreshActions(id: string): void {
    const account = this.accounts.get(id);
    if (!account) return;

    account.availableActions = account.maxActions;
    this.accounts.set(id, account);
    this.notifyCallbacks(account);
  }

  retryVerification(id: string): void {
    const account = this.accounts.get(id);
    if (!account) return;

    this.clearRetryTimeout(id);
    account.retryCount = 0;
    this.startVerification(id);
  }

  private async startVerification(id: string): Promise<void> {
    const account = this.accounts.get(id);
    if (!account) return;

    account.status = 'verifying';
    account.verificationError = undefined;
    this.accounts.set(id, account);
    this.notifyCallbacks(account);

    try {
      console.log(`Verifying account ${id}...`);
      const profileData = await VerificationService.startVerification(account.platform, account.handle);
      
      account.status = 'verified';
      account.profileData = profileData;
      account.availableActions = account.maxActions;
      account.retryCount = 0;
      console.log(`✅ Account ${id} verification successful`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      account.verificationError = errorMessage;
      
      if (account.retryCount < account.maxRetries) {
        account.status = 'retrying';
        account.retryCount++;
        console.log(`Retrying verification for ${id} (attempt ${account.retryCount})`);
        
        const delay = this.calculateRetryDelay(account.retryCount);
        const timeoutId = setTimeout(() => {
          this.startVerification(id);
        }, delay);
        
        this.retryTimeouts.set(id, timeoutId);
      } else {
        account.status = 'failed';
        account.availableActions = 0;
        console.error(`❌ Account ${id} verification failed after ${account.maxRetries} attempts`);
      }
    }

    this.accounts.set(id, account);
    this.notifyCallbacks(account);
  }

  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000;
    const maxDelay = 10000;
    return Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
  }

  private clearRetryTimeout(id: string): void {
    const timeoutId = this.retryTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(id);
    }
  }

  private notifyCallbacks(account: AccountData): void {
    this.callbacks.forEach(callback => callback(account));
  }

  destroy(): void {
    this.retryTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryTimeouts.clear();
    this.accounts.clear();
    this.callbacks.clear();
  }
}