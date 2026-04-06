import { describe, it, expect, beforeEach } from 'vitest';
import { IntentParser } from '../src/core/parser';
import { IntentAction } from '../src/types';

describe('IntentParser', () => {
  let parser: IntentParser;

  beforeEach(() => {
    parser = new IntentParser();
  });

  describe('swap intents', () => {
    it('should parse basic swap intent', async () => {
      const result = await parser.parse('swap 5 SOL for USDC');

      expect(result.action).toBe(IntentAction.SWAP);
      expect(result.parameters.amount).toBe(5);
      expect(result.parameters.tokenA).toBe('SOL');
      expect(result.parameters.tokenB).toBe('USDC');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should parse exchange variant', async () => {
      const result = await parser.parse('exchange 10 USDC to SOL');

      expect(result.action).toBe(IntentAction.SWAP);
      expect(result.parameters.amount).toBe(10);
      expect(result.parameters.tokenA).toBe('USDC');
      expect(result.parameters.tokenB).toBe('SOL');
    });

    it('should parse trade variant', async () => {
      const result = await parser.parse('trade 100 BONK for USDC');

      expect(result.action).toBe(IntentAction.SWAP);
      expect(result.parameters.amount).toBe(100);
      expect(result.parameters.tokenA).toBe('BONK');
      expect(result.parameters.tokenB).toBe('USDC');
    });

    it('should handle decimal amounts', async () => {
      const result = await parser.parse('swap 0.5 SOL for USDC');

      expect(result.parameters.amount).toBe(0.5);
    });
  });

  describe('send intents', () => {
    it('should parse send intent with address', async () => {
      const address = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const result = await parser.parse(`send 2 SOL to ${address}`);

      expect(result.action).toBe(IntentAction.SEND);
      expect(result.parameters.amount).toBe(2);
      expect(result.parameters.tokenA).toBe('SOL');
      expect(result.parameters.recipient).toBe(address);
    });

    it('should parse transfer variant', async () => {
      const address = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const result = await parser.parse(`transfer 5 USDC to ${address}`);

      expect(result.action).toBe(IntentAction.SEND);
      expect(result.parameters.amount).toBe(5);
      expect(result.parameters.tokenA).toBe('USDC');
    });
  });

  describe('stake intents', () => {
    it('should parse stake intent', async () => {
      const result = await parser.parse('stake 10 SOL');

      expect(result.action).toBe(IntentAction.STAKE);
      expect(result.parameters.amount).toBe(10);
      expect(result.parameters.tokenA).toBe('SOL');
    });

    it('should parse delegate variant', async () => {
      const result = await parser.parse('delegate 5 SOL');

      expect(result.action).toBe(IntentAction.STAKE);
      expect(result.parameters.amount).toBe(5);
    });
  });

  describe('unstake intents', () => {
    it('should parse unstake intent', async () => {
      const result = await parser.parse('unstake 3 SOL');

      expect(result.action).toBe(IntentAction.UNSTAKE);
      expect(result.parameters.amount).toBe(3);
      expect(result.parameters.tokenA).toBe('SOL');
    });
  });

  describe('balance intents', () => {
    it('should parse balance check', async () => {
      const result = await parser.parse('show my balance');

      expect(result.action).toBe(IntentAction.BALANCE);
    });

    it('should parse balance variants', async () => {
      const queries = [
        'check balance',
        "what's my balance",
        'how much do i have',
      ];

      for (const query of queries) {
        const result = await parser.parse(query);
        expect(result.action).toBe(IntentAction.BALANCE);
      }
    });
  });

  describe('price intents', () => {
    it('should parse price query', async () => {
      const result = await parser.parse("what's the price of SOL");

      expect(result.action).toBe(IntentAction.PRICE);
      expect(result.parameters.tokenA).toBe('SOL');
    });

    it('should parse price variants', async () => {
      const result = await parser.parse('how much is USDC');

      expect(result.action).toBe(IntentAction.PRICE);
      expect(result.parameters.tokenA).toBe('USDC');
    });

    it('should parse short price query', async () => {
      const result = await parser.parse('SOL price');

      expect(result.action).toBe(IntentAction.PRICE);
      expect(result.parameters.tokenA).toBe('SOL');
    });
  });

  describe('buy product intents', () => {
    it('should parse buy intent', async () => {
      const result = await parser.parse('buy iPhone 15 Pro');

      expect(result.action).toBe(IntentAction.BUY_PRODUCT);
      expect(result.parameters.productQuery).toBe('iPhone 15 Pro');
    });

    it('should parse purchase variant', async () => {
      const result = await parser.parse('purchase MacBook Air with usdc');

      expect(result.action).toBe(IntentAction.BUY_PRODUCT);
      expect(result.parameters.productQuery).toBe('MacBook Air');
    });
  });

  describe('entity extraction', () => {
    it('should extract token entities', async () => {
      const result = await parser.parse('swap 5 SOL for USDC');

      const tokenEntities = result.metadata.entities.filter(
        (e) => e.type === 'TOKEN'
      );

      expect(tokenEntities).toHaveLength(2);
      expect(tokenEntities[0].value).toBe('SOL');
      expect(tokenEntities[1].value).toBe('USDC');
    });

    it('should extract amount entities', async () => {
      const result = await parser.parse('swap 5 SOL for USDC');

      const amountEntities = result.metadata.entities.filter(
        (e) => e.type === 'AMOUNT'
      );

      expect(amountEntities.length).toBeGreaterThan(0);
    });

    it('should extract address entities', async () => {
      const address = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const result = await parser.parse(`send 2 SOL to ${address}`);

      const addressEntities = result.metadata.entities.filter(
        (e) => e.type === 'ADDRESS'
      );

      expect(addressEntities).toHaveLength(1);
      expect(addressEntities[0].value).toBe(address);
    });
  });

  describe('metadata', () => {
    it('should include processing time', async () => {
      const result = await parser.parse('swap 5 SOL for USDC');

      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should include raw query', async () => {
      const query = 'swap 5 SOL for USDC';
      const result = await parser.parse(query);

      expect(result.metadata.rawQuery).toBe(query);
    });

    it('should include timestamp', async () => {
      const result = await parser.parse('swap 5 SOL for USDC');

      expect(result.metadata.timestamp).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should throw error for empty query', async () => {
      await expect(parser.parse('')).rejects.toThrow('Empty query provided');
    });

    it('should return UNKNOWN for unrecognized intent', async () => {
      const result = await parser.parse('random gibberish text');

      expect(result.action).toBe(IntentAction.UNKNOWN);
      expect(result.confidence).toBe(0);
    });
  });
});
