import { describe, it, expect, beforeEach } from 'vitest';
import { RiskAssessmentEngine, RiskLevel } from '../src/core/risk-assessment';

describe('RiskAssessmentEngine', () => {
  let engine: RiskAssessmentEngine;
  const mockRpcEndpoint = 'https://api.mainnet-beta.solana.com';

  beforeEach(() => {
    engine = new RiskAssessmentEngine(mockRpcEndpoint);
  });

  describe('assessSwapRisk', () => {
    it('should assess low risk for verified tokens', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        5
      );

      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.score).toBeLessThan(30);
      expect(result.details.verified).toBe(true);
    });

    it('should assess higher risk for unverified tokens', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'UnverifiedTokenMintAddress123456789012345',
        5
      );

      expect(result.riskLevel).toBeOneOf([
        RiskLevel.MEDIUM,
        RiskLevel.HIGH,
        RiskLevel.CRITICAL,
      ]);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should include risk flags in assessment', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'UnverifiedTokenMintAddress123456789012345',
        5
      );

      expect(Array.isArray(result.flags)).toBe(true);
      if (result.flags.length > 0) {
        expect(result.flags[0]).toHaveProperty('type');
        expect(result.flags[0]).toHaveProperty('severity');
        expect(result.flags[0]).toHaveProperty('message');
      }
    });

    it('should provide recommendation based on risk level', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        5
      );

      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });

    it('should include liquidity information in details', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        5
      );

      expect(result.details).toHaveProperty('liquidityUsd');
      expect(result.details).toHaveProperty('verified');
    });
  });

  describe('assessTransferRisk', () => {
    it('should assess low risk for valid addresses', async () => {
      const result = await engine.assessTransferRisk(
        'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        1
      );

      expect(result.riskLevel).toBeOneOf([RiskLevel.LOW, RiskLevel.MEDIUM]);
      expect(result.score).toBeLessThan(50);
    });

    it('should assess high risk for invalid addresses', async () => {
      const result = await engine.assessTransferRisk('invalid_address', 1);

      expect(result.riskLevel).toBeOneOf([RiskLevel.HIGH, RiskLevel.CRITICAL]);
      expect(result.score).toBeGreaterThan(30);
    });

    it('should include appropriate flags for invalid addresses', async () => {
      const result = await engine.assessTransferRisk('invalid_address', 1);

      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.flags[0].severity).toBeOneOf(['MEDIUM', 'HIGH', 'CRITICAL']);
    });

    it('should provide recommendation for transfers', async () => {
      const result = await engine.assessTransferRisk(
        'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        1
      );

      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
    });
  });

  describe('risk level calculation', () => {
    it('should return LOW for score < 30', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        5
      );

      if (result.score < 30) {
        expect(result.riskLevel).toBe(RiskLevel.LOW);
      }
    });

    it('should return appropriate level for score ranges', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'UnverifiedTokenMintAddress123456789012345',
        5
      );

      if (result.score >= 70) {
        expect(result.riskLevel).toBe(RiskLevel.CRITICAL);
      } else if (result.score >= 50) {
        expect(result.riskLevel).toBe(RiskLevel.HIGH);
      } else if (result.score >= 30) {
        expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      } else {
        expect(result.riskLevel).toBe(RiskLevel.LOW);
      }
    });
  });

  describe('risk details', () => {
    it('should include holder count when available', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        5
      );

      expect(result.details).toHaveProperty('holderCount');
    });

    it('should include verification status', async () => {
      const result = await engine.assessSwapRisk(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        5
      );

      expect(result.details).toHaveProperty('verified');
      expect(typeof result.details.verified).toBe('boolean');
    });
  });
});
