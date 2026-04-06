import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TransactionBuildResult,
  TransactionOptions,
  PriorityLevel,
  ParsedIntent,
  IntentAction,
} from '../types';
import { TransactionError, ValidationError } from './errors';

export class TransactionBuilder {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async build(
    intent: ParsedIntent,
    walletAddress: string,
    options: TransactionOptions = {}
  ): Promise<TransactionBuildResult> {
    const startTime = performance.now();

    this.validateIntent(intent);
    this.validateAddress(walletAddress);

    const transaction = new Transaction();
    const wallet = new PublicKey(walletAddress);

    const priorityFee = this.calculatePriorityFee(
      options.priorityLevel || PriorityLevel.MEDIUM
    );
    const computeUnitLimit = options.computeUnitLimit || 200000;

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnitLimit,
      })
    );

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      })
    );

    switch (intent.action) {
      case IntentAction.SEND:
        await this.addSendInstructions(transaction, intent, wallet);
        break;

      case IntentAction.SWAP:
        await this.addSwapInstructions(transaction, intent, wallet);
        break;

      case IntentAction.STAKE:
        await this.addStakeInstructions(transaction, intent, wallet);
        break;

      case IntentAction.UNSTAKE:
        await this.addUnstakeInstructions(transaction, intent, wallet);
        break;

      default:
        throw new TransactionError(
          `Unsupported action: ${intent.action}`
        );
    }

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet;

    const estimatedFee = await this.estimateFee(transaction);
    const buildTimeMs = performance.now() - startTime;

    return {
      transaction,
      estimatedFee,
      computeUnits: computeUnitLimit,
      priorityFee,
      metadata: {
        buildTimeMs,
        instructions: transaction.instructions.length,
        signers: 1,
        requiresApproval: true,
      },
    };
  }

  private validateIntent(intent: ParsedIntent): void {
    if (intent.confidence < 0.7) {
      throw new ValidationError(
        'Intent confidence too low',
        { confidence: intent.confidence }
      );
    }

    if (intent.action === IntentAction.UNKNOWN) {
      throw new ValidationError('Unable to determine intent action');
    }
  }

  private validateAddress(address: string): void {
    try {
      new PublicKey(address);
    } catch {
      throw new ValidationError(`Invalid Solana address: ${address}`);
    }
  }

  private calculatePriorityFee(level: PriorityLevel): number {
    const feeMap: Record<PriorityLevel, number> = {
      [PriorityLevel.NONE]: 0,
      [PriorityLevel.LOW]: 1000,
      [PriorityLevel.MEDIUM]: 5000,
      [PriorityLevel.HIGH]: 10000,
      [PriorityLevel.VERY_HIGH]: 50000,
    };

    return feeMap[level];
  }

  private async addSendInstructions(
    transaction: Transaction,
    intent: ParsedIntent,
    sender: PublicKey
  ): Promise<void> {
    const { amount, recipient, tokenA } = intent.parameters;

    if (!amount || !recipient) {
      throw new ValidationError('Missing required parameters for send');
    }

    const recipientPubkey = new PublicKey(recipient);

    if (tokenA === 'SOL') {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipientPubkey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
    } else {
      throw new TransactionError('SPL token transfers not yet implemented');
    }
  }

  private async addSwapInstructions(
    transaction: Transaction,
    intent: ParsedIntent,
    wallet: PublicKey
  ): Promise<void> {
    throw new TransactionError('Swap instructions require Jupiter integration');
  }

  private async addStakeInstructions(
    transaction: Transaction,
    intent: ParsedIntent,
    wallet: PublicKey
  ): Promise<void> {
    throw new TransactionError('Stake instructions not yet implemented');
  }

  private async addUnstakeInstructions(
    transaction: Transaction,
    intent: ParsedIntent,
    wallet: PublicKey
  ): Promise<void> {
    throw new TransactionError('Unstake instructions not yet implemented');
  }

  private async estimateFee(transaction: Transaction): Promise<number> {
    try {
      const fee = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      return fee.value || 5000;
    } catch {
      return 5000;
    }
  }
}
