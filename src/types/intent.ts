export enum IntentAction {
  SWAP = 'SWAP',
  SEND = 'SEND',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  BALANCE = 'BALANCE',
  PRICE = 'PRICE',
  BUY_PRODUCT = 'BUY_PRODUCT',
  UNKNOWN = 'UNKNOWN',
}

export interface ParsedIntent {
  action: IntentAction;
  parameters: IntentParameters;
  confidence: number;
  metadata: IntentMetadata;
}

export interface IntentParameters {
  tokenA?: string;
  tokenB?: string;
  amount?: number;
  recipient?: string;
  validator?: string;
  productQuery?: string;
  [key: string]: unknown;
}

export interface IntentMetadata {
  processingTimeMs: number;
  rawQuery: string;
  entities: ExtractedEntity[];
  timestamp: number;
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export enum EntityType {
  TOKEN = 'TOKEN',
  AMOUNT = 'AMOUNT',
  ADDRESS = 'ADDRESS',
  VALIDATOR = 'VALIDATOR',
  PRODUCT = 'PRODUCT',
  ACTION = 'ACTION',
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: ConversationMessage[];
  walletAddress?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: ParsedIntent;
}
