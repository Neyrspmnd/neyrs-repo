import {
  IntentAction,
  ParsedIntent,
  IntentParameters,
  EntityType,
  ExtractedEntity,
} from '../types';
import { ParseError } from './errors';

export class IntentParser {
  private readonly actionPatterns: Map<IntentAction, RegExp[]>;
  private readonly tokenPatterns: RegExp;
  private readonly amountPatterns: RegExp;
  private readonly addressPatterns: RegExp;

  constructor() {
    this.actionPatterns = new Map([
      [
        IntentAction.SWAP,
        [
          /swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,
          /exchange\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,
          /trade\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,
        ],
      ],
      [
        IntentAction.SEND,
        [
          /send\s+(\d+\.?\d*)\s+(\w+)\s+to\s+([A-Za-z0-9]{32,44})/i,
          /transfer\s+(\d+\.?\d*)\s+(\w+)\s+to\s+([A-Za-z0-9]{32,44})/i,
        ],
      ],
      [
        IntentAction.STAKE,
        [
          /stake\s+(\d+\.?\d*)\s+(\w+)/i,
          /delegate\s+(\d+\.?\d*)\s+(\w+)/i,
        ],
      ],
      [
        IntentAction.UNSTAKE,
        [
          /unstake\s+(\d+\.?\d*)\s+(\w+)/i,
          /undelegate\s+(\d+\.?\d*)\s+(\w+)/i,
        ],
      ],
      [
        IntentAction.BALANCE,
        [
          /(?:show|check|what'?s?)\s+(?:my\s+)?balance/i,
          /how\s+much\s+(?:\w+\s+)?(?:do\s+)?i\s+have/i,
        ],
      ],
      [
        IntentAction.PRICE,
        [
          /(?:what'?s?|check)\s+(?:the\s+)?price\s+of\s+(\w+)/i,
          /how\s+much\s+is\s+(\w+)/i,
          /(\w+)\s+price/i,
        ],
      ],
      [
        IntentAction.BUY_PRODUCT,
        [
          /buy\s+(.+?)(?:\s+with\s+usdc)?$/i,
          /purchase\s+(.+?)(?:\s+with\s+usdc)?$/i,
          /order\s+(.+?)(?:\s+with\s+usdc)?$/i,
        ],
      ],
    ]);

    this.tokenPatterns = /\b(SOL|USDC|USDT|BTC|ETH|BONK|JUP|RAY|ORCA)\b/gi;
    this.amountPatterns = /\b(\d+\.?\d*)\b/g;
    this.addressPatterns = /\b([A-Za-z0-9]{32,44})\b/g;
  }

  async parse(query: string): Promise<ParsedIntent> {
    const startTime = performance.now();

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      throw new ParseError('Empty query provided');
    }

    let action = IntentAction.UNKNOWN;
    let parameters: IntentParameters = {};
    let confidence = 0;

    for (const [intentAction, patterns] of this.actionPatterns) {
      for (const pattern of patterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          action = intentAction;
          confidence = 0.9;
          parameters = this.extractParameters(intentAction, match);
          break;
        }
      }
      if (action !== IntentAction.UNKNOWN) break;
    }

    const entities = this.extractEntities(query);
    const processingTimeMs = performance.now() - startTime;

    return {
      action,
      parameters,
      confidence,
      metadata: {
        processingTimeMs,
        rawQuery: query,
        entities,
        timestamp: Date.now(),
      },
    };
  }

  private extractParameters(
    action: IntentAction,
    match: RegExpMatchArray
  ): IntentParameters {
    const params: IntentParameters = {};

    switch (action) {
      case IntentAction.SWAP:
        params.amount = parseFloat(match[1]);
        params.tokenA = match[2].toUpperCase();
        params.tokenB = match[3].toUpperCase();
        break;

      case IntentAction.SEND:
        params.amount = parseFloat(match[1]);
        params.tokenA = match[2].toUpperCase();
        params.recipient = match[3];
        break;

      case IntentAction.STAKE:
      case IntentAction.UNSTAKE:
        params.amount = parseFloat(match[1]);
        params.tokenA = match[2].toUpperCase();
        break;

      case IntentAction.PRICE:
        params.tokenA = match[1].toUpperCase();
        break;

      case IntentAction.BUY_PRODUCT:
        params.productQuery = match[1].trim();
        break;
    }

    return params;
  }

  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    let match: RegExpExecArray | null;

    this.tokenPatterns.lastIndex = 0;
    while ((match = this.tokenPatterns.exec(query)) !== null) {
      entities.push({
        type: EntityType.TOKEN,
        value: match[0].toUpperCase(),
        confidence: 0.95,
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }

    this.amountPatterns.lastIndex = 0;
    while ((match = this.amountPatterns.exec(query)) !== null) {
      entities.push({
        type: EntityType.AMOUNT,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }

    this.addressPatterns.lastIndex = 0;
    while ((match = this.addressPatterns.exec(query)) !== null) {
      entities.push({
        type: EntityType.ADDRESS,
        value: match[0],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }

    return entities;
  }
}
