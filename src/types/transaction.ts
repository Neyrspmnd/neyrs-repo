import { Transaction, VersionedTransaction } from '@solana/web3.js';

export enum PriorityLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export interface TransactionBuildResult {
  transaction: Transaction | VersionedTransaction;
  estimatedFee: number;
  computeUnits: number;
  priorityFee: number;
  metadata: TransactionMetadata;
}

export interface TransactionMetadata {
  buildTimeMs: number;
  instructions: number;
  signers: number;
  requiresApproval: boolean;
}

export interface TransactionOptions {
  priorityLevel?: PriorityLevel;
  computeUnitLimit?: number;
  computeUnitPrice?: number;
  skipPreflight?: boolean;
  maxRetries?: number;
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  slippageBps: number;
  route: RouteInfo[];
  fees: SwapFees;
}

export interface RouteInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface SwapFees {
  platformFee: number;
  liquidityProviderFee: number;
  networkFee: number;
  total: number;
}

export interface StakeInfo {
  validator: string;
  amount: number;
  activationEpoch: number;
  deactivationEpoch?: number;
  rewards: number;
  apy: number;
}
