import { Connection } from '@solana/web3.js';
import { IntentParser } from './core/parser';
import { TransactionBuilder } from './core/transaction-builder';
import { RiskAssessmentEngine } from './core/risk-assessment';
import { JupiterAggregator } from './integrations/jupiter';
import { JitoMEVProtection } from './integrations/jito';
import { Logger, LogLevel } from './utils/logger';
import {
  ParsedIntent,
  TransactionBuildResult,
  TransactionOptions,
  RiskAssessment,
} from './types';

export interface NeyrsClientConfig {
  rpcEndpoint: string;
  logLevel?: LogLevel;
  defaultSlippageBps?: number;
  mevProtection?: boolean;
  jupiterEndpoint?: string;
  jitoEndpoint?: string;
}

export class NeyrsClient {
  private connection: Connection;
  private parser: IntentParser;
  private transactionBuilder: TransactionBuilder;
  private riskEngine: RiskAssessmentEngine;
  private jupiter: JupiterAggregator;
  private jito?: JitoMEVProtection;
  private logger: Logger;
  private config: Required<NeyrsClientConfig>;

  constructor(config: NeyrsClientConfig) {
    this.config = {
      logLevel: LogLevel.INFO,
      defaultSlippageBps: 50,
      mevProtection: true,
      jupiterEndpoint: 'https://quote-api.jup.ag/v6',
      jitoEndpoint: 'https://mainnet.block-engine.jito.wtf',
      ...config,
    };

    this.connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    this.parser = new IntentParser();
    this.transactionBuilder = new TransactionBuilder(this.config.rpcEndpoint);
    this.riskEngine = new RiskAssessmentEngine(this.config.rpcEndpoint);
    this.jupiter = new JupiterAggregator(
      this.config.rpcEndpoint,
      this.config.jupiterEndpoint
    );

    if (this.config.mevProtection) {
      this.jito = new JitoMEVProtection(
        this.config.rpcEndpoint,
        this.config.jitoEndpoint
      );
    }

    this.logger = new Logger(this.config.logLevel, {
      component: 'NeyrsClient',
    });

    this.logger.info('Neyrs client initialized', {
      rpcEndpoint: this.config.rpcEndpoint,
      mevProtection: this.config.mevProtection,
    });
  }

  async resolveIntent(options: { query: string }): Promise<ParsedIntent> {
    this.logger.debug('Resolving intent', { query: options.query });

    const intent = await this.parser.parse(options.query);

    this.logger.info('Intent resolved', {
      action: intent.action,
      confidence: intent.confidence,
      processingTime: intent.metadata.processingTimeMs,
    });

    return intent;
  }

  async buildTransaction(
    intent: ParsedIntent,
    walletAddress: string,
    options?: TransactionOptions
  ): Promise<TransactionBuildResult> {
    this.logger.debug('Building transaction', {
      action: intent.action,
      walletAddress,
    });

    const result = await this.transactionBuilder.build(
      intent,
      walletAddress,
      options
    );

    this.logger.info('Transaction built', {
      instructions: result.metadata.instructions,
      estimatedFee: result.estimatedFee,
      buildTime: result.metadata.buildTimeMs,
    });

    return result;
  }

  async assessRisk(intent: ParsedIntent): Promise<RiskAssessment> {
    this.logger.debug('Assessing risk', { action: intent.action });

    let assessment: RiskAssessment;

    switch (intent.action) {
      case 'SWAP':
        assessment = await this.riskEngine.assessSwapRisk(
          intent.parameters.tokenA || '',
          intent.parameters.tokenB || '',
          intent.parameters.amount || 0
        );
        break;

      case 'SEND':
        assessment = await this.riskEngine.assessTransferRisk(
          intent.parameters.recipient || '',
          intent.parameters.amount || 0
        );
        break;

      default:
        assessment = {
          riskLevel: 'LOW',
          score: 0,
          flags: [],
          recommendation: 'No specific risks identified',
          details: { verified: true },
        };
    }

    this.logger.info('Risk assessment complete', {
      riskLevel: assessment.riskLevel,
      score: assessment.score,
      flags: assessment.flags.length,
    });

    return assessment;
  }

  async getBalance(walletAddress: string): Promise<number> {
    this.logger.debug('Fetching balance', { walletAddress });

    const balance = await this.connection.getBalance(
      new (await import('@solana/web3.js')).PublicKey(walletAddress)
    );

    this.logger.info('Balance fetched', {
      walletAddress,
      balance: balance / 1e9,
    });

    return balance;
  }

  async getTokenPrice(symbol: string): Promise<number> {
    this.logger.debug('Fetching token price', { symbol });

    const tokenMintMap: Record<string, string> = {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    };

    const mint = tokenMintMap[symbol.toUpperCase()];
    if (!mint) {
      this.logger.warn('Unknown token symbol', { symbol });
      return 0;
    }

    const price = await this.jupiter.getTokenPrice(mint);

    this.logger.info('Token price fetched', { symbol, price });

    return price;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getJupiter(): JupiterAggregator {
    return this.jupiter;
  }

  getJito(): JitoMEVProtection | undefined {
    return this.jito;
  }
}
