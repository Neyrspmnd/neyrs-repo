import axios from 'axios';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { NetworkError } from '../core/errors';

export interface JitoBundle {
  transactions: (Transaction | VersionedTransaction)[];
  tipAmount?: number;
}

export interface JitoBundleResult {
  bundleId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  landedTipLamports?: number;
}

export class JitoMEVProtection {
  private blockEngineEndpoint: string;
  private rpcEndpoint: string;

  constructor(rpcEndpoint: string, blockEngineEndpoint?: string) {
    this.rpcEndpoint = rpcEndpoint;
    this.blockEngineEndpoint =
      blockEngineEndpoint || 'https://mainnet.block-engine.jito.wtf';
  }

  async sendBundle(bundle: JitoBundle): Promise<JitoBundleResult> {
    try {
      const serializedTransactions = bundle.transactions.map((tx) => {
        if ('serialize' in tx) {
          return tx.serialize();
        }
        return tx.serialize();
      });

      const response = await axios.post(
        `${this.blockEngineEndpoint}/api/v1/bundles`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [serializedTransactions.map((tx) => tx.toString('base64'))],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        bundleId: response.data.result || this.generateBundleId(),
        status: 'PENDING',
      };
    } catch (error) {
      throw new NetworkError(
        'Failed to send Jito bundle',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getBundleStatus(bundleId: string): Promise<JitoBundleResult> {
    try {
      const response = await axios.post(
        `${this.blockEngineEndpoint}/api/v1/bundles`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const status = response.data.result?.value?.[0];

      return {
        bundleId,
        status: this.parseStatus(status?.confirmation_status),
        landedTipLamports: status?.landed_tip_lamports,
      };
    } catch (error) {
      throw new NetworkError(
        'Failed to get bundle status',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async waitForBundleConfirmation(
    bundleId: string,
    timeoutMs = 60000
  ): Promise<JitoBundleResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getBundleStatus(bundleId);

      if (result.status === 'CONFIRMED' || result.status === 'FAILED') {
        return result;
      }

      await this.sleep(2000);
    }

    throw new NetworkError('Bundle confirmation timeout');
  }

  private parseStatus(
    status: string | undefined
  ): 'PENDING' | 'CONFIRMED' | 'FAILED' {
    if (!status) return 'PENDING';

    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'finalized':
        return 'CONFIRMED';
      case 'failed':
      case 'invalid':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  private generateBundleId(): string {
    return `bundle_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calculateOptimalTip(priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    const tipMap = {
      LOW: 10000,
      MEDIUM: 50000,
      HIGH: 100000,
    };

    return tipMap[priorityLevel];
  }
}
