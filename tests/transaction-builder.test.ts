import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionBuilder } from '../src/core/transaction-builder';
import { IntentAction, PriorityLevel } from '../src/types';
import { ValidationError, TransactionError } from '../src/core/errors';

describe('TransactionBuilder', () => {
  let builder: TransactionBuilder;
  const mockRpcEndpoint = 'https://api.mainnet-beta.solana.com';
  const testWallet = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

  beforeEach(() => {
    builder = new TransactionBuilder(mockRpcEndpoint);
  });

  describe('build', () => {
    it('should build transaction for SEND intent', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL to address',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        priorityLevel: PriorityLevel.MEDIUM,
      });

      expect(result.transaction).toBeDefined();
      expect(result.estimatedFee).toBeGreaterThan(0);
      expect(result.computeUnits).toBe(200000);
      expect(result.priorityFee).toBe(5000);
      expect(result.metadata.instructions).toBeGreaterThan(0);
    });

    it('should throw error for low confidence intent', async () => {
      const intent = {
        action: IntentAction.SWAP,
        parameters: {},
        confidence: 0.5,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'unclear query',
          entities: [],
          timestamp: Date.now(),
        },
      };

      await expect(
        builder.build(intent, testWallet)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for UNKNOWN action', async () => {
      const intent = {
        action: IntentAction.UNKNOWN,
        parameters: {},
        confidence: 0.9,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'unknown action',
          entities: [],
          timestamp: Date.now(),
        },
      };

      await expect(
        builder.build(intent, testWallet)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid wallet address', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      await expect(
        builder.build(intent, 'invalid_address')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for SWAP action (not implemented)', async () => {
      const intent = {
        action: IntentAction.SWAP,
        parameters: {
          amount: 5,
          tokenA: 'SOL',
          tokenB: 'USDC',
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'swap 5 SOL for USDC',
          entities: [],
          timestamp: Date.now(),
        },
      };

      await expect(
        builder.build(intent, testWallet)
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('priority fee calculation', () => {
    it('should calculate correct fee for NONE priority', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        priorityLevel: PriorityLevel.NONE,
      });

      expect(result.priorityFee).toBe(0);
    });

    it('should calculate correct fee for LOW priority', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        priorityLevel: PriorityLevel.LOW,
      });

      expect(result.priorityFee).toBe(1000);
    });

    it('should calculate correct fee for HIGH priority', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        priorityLevel: PriorityLevel.HIGH,
      });

      expect(result.priorityFee).toBe(10000);
    });

    it('should calculate correct fee for VERY_HIGH priority', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        priorityLevel: PriorityLevel.VERY_HIGH,
      });

      expect(result.priorityFee).toBe(50000);
    });
  });

  describe('compute unit limit', () => {
    it('should use default compute unit limit', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet);

      expect(result.computeUnits).toBe(200000);
    });

    it('should use custom compute unit limit', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet, {
        computeUnitLimit: 400000,
      });

      expect(result.computeUnits).toBe(400000);
    });
  });

  describe('metadata', () => {
    it('should include build time in metadata', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet);

      expect(result.metadata.buildTimeMs).toBeGreaterThan(0);
    });

    it('should include instruction count in metadata', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet);

      expect(result.metadata.instructions).toBeGreaterThan(0);
    });

    it('should mark transaction as requiring approval', async () => {
      const intent = {
        action: IntentAction.SEND,
        parameters: {
          amount: 1,
          tokenA: 'SOL',
          recipient: testWallet,
        },
        confidence: 0.95,
        metadata: {
          processingTimeMs: 25,
          rawQuery: 'send 1 SOL',
          entities: [],
          timestamp: Date.now(),
        },
      };

      const result = await builder.build(intent, testWallet);

      expect(result.metadata.requiresApproval).toBe(true);
    });
  });
});
