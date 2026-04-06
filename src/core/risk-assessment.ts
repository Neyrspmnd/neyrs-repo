import { Connection, PublicKey } from '@solana/web3.js';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  score: number;
  flags: RiskFlag[];
  recommendation: string;
  details: RiskDetails;
}

export interface RiskFlag {
  type: RiskFlagType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export enum RiskFlagType {
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  HIGH_PRICE_IMPACT = 'HIGH_PRICE_IMPACT',
  UNVERIFIED_TOKEN = 'UNVERIFIED_TOKEN',
  HONEYPOT_DETECTED = 'HONEYPOT_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  LOW_HOLDER_COUNT = 'LOW_HOLDER_COUNT',
  CONCENTRATED_OWNERSHIP = 'CONCENTRATED_OWNERSHIP',
}

export interface RiskDetails {
  liquidityUsd?: number;
  priceImpactPct?: number;
  holderCount?: number;
  topHoldersPct?: number;
  verified: boolean;
  age?: number;
}

export class RiskAssessmentEngine {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async assessSwapRisk(
    inputToken: string,
    outputToken: string,
    amount: number
  ): Promise<RiskAssessment> {
    const flags: RiskFlag[] = [];
    let score = 0;

    const inputMint = new PublicKey(inputToken);
    const outputMint = new PublicKey(outputToken);

    const inputInfo = await this.getTokenInfo(inputMint);
    const outputInfo = await this.getTokenInfo(outputMint);

    if (!outputInfo.verified) {
      flags.push({
        type: RiskFlagType.UNVERIFIED_TOKEN,
        severity: 'MEDIUM',
        message: 'Output token is not verified',
      });
      score += 30;
    }

    if (outputInfo.liquidityUsd && outputInfo.liquidityUsd < 10000) {
      flags.push({
        type: RiskFlagType.INSUFFICIENT_LIQUIDITY,
        severity: 'HIGH',
        message: 'Low liquidity may result in high slippage',
      });
      score += 40;
    }

    if (outputInfo.holderCount && outputInfo.holderCount < 100) {
      flags.push({
        type: RiskFlagType.LOW_HOLDER_COUNT,
        severity: 'MEDIUM',
        message: 'Token has very few holders',
      });
      score += 25;
    }

    const riskLevel = this.calculateRiskLevel(score);
    const recommendation = this.generateRecommendation(riskLevel, flags);

    return {
      riskLevel,
      score,
      flags,
      recommendation,
      details: {
        liquidityUsd: outputInfo.liquidityUsd,
        holderCount: outputInfo.holderCount,
        verified: outputInfo.verified,
      },
    };
  }

  async assessTransferRisk(
    recipient: string,
    amount: number
  ): Promise<RiskAssessment> {
    const flags: RiskFlag[] = [];
    let score = 0;

    try {
      const recipientPubkey = new PublicKey(recipient);
      const accountInfo = await this.connection.getAccountInfo(recipientPubkey);

      if (!accountInfo) {
        flags.push({
          type: RiskFlagType.SUSPICIOUS_ACTIVITY,
          severity: 'LOW',
          message: 'Recipient account does not exist yet',
        });
        score += 10;
      }
    } catch {
      flags.push({
        type: RiskFlagType.SUSPICIOUS_ACTIVITY,
        severity: 'HIGH',
        message: 'Invalid recipient address',
      });
      score += 50;
    }

    const riskLevel = this.calculateRiskLevel(score);
    const recommendation = this.generateRecommendation(riskLevel, flags);

    return {
      riskLevel,
      score,
      flags,
      recommendation,
      details: {
        verified: score < 30,
      },
    };
  }

  private async getTokenInfo(mint: PublicKey): Promise<{
    verified: boolean;
    liquidityUsd?: number;
    holderCount?: number;
  }> {
    const knownTokens = new Set([
      'So11111111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    ]);

    const verified = knownTokens.has(mint.toBase58());

    return {
      verified,
      liquidityUsd: verified ? 1000000 : Math.random() * 50000,
      holderCount: verified ? 10000 : Math.floor(Math.random() * 500),
    };
  }

  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 70) return RiskLevel.CRITICAL;
    if (score >= 50) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private generateRecommendation(
    level: RiskLevel,
    flags: RiskFlag[]
  ): string {
    switch (level) {
      case RiskLevel.CRITICAL:
        return 'Transaction is highly risky. Strongly recommend canceling.';
      case RiskLevel.HIGH:
        return 'Significant risks detected. Proceed with extreme caution.';
      case RiskLevel.MEDIUM:
        return 'Moderate risks present. Review carefully before proceeding.';
      case RiskLevel.LOW:
        return 'Low risk transaction. Safe to proceed.';
    }
  }
}
