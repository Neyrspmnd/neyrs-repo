export interface WalletBalance {
  address: string;
  solBalance: number;
  tokens: TokenBalance[];
  totalValueUsd: number;
  lastUpdated: number;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  valueUsd: number;
  priceUsd: number;
}

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  coingeckoId?: string;
  verified: boolean;
}

export interface WalletOperation {
  type: 'SWAP' | 'SEND' | 'STAKE' | 'UNSTAKE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  signature?: string;
  timestamp: number;
  details: Record<string, unknown>;
}
