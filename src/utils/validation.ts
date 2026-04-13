import { PublicKey } from '@solana/web3.js';
import { ValidationError } from '../core/errors';

export class Validator {
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  static validateSolanaAddress(address: string): void {
    if (!this.isValidSolanaAddress(address)) {
      throw new ValidationError(`Invalid Solana address: ${address}`);
    }
  }

  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0 && isFinite(amount);
  }

  static validateAmount(amount: number, fieldName = 'amount'): void {
    if (!this.isValidAmount(amount)) {
      throw new ValidationError(`Invalid ${fieldName}: must be a positive number`);
    }
  }

  static isValidToken(symbol: string): boolean {
    const validTokens = new Set([
      'SOL',
      'USDC',
      'USDT',
      'BTC',
      'ETH',
      'BONK',
      'JUP',
      'RAY',
      'ORCA',
    ]);
    return validTokens.has(symbol.toUpperCase());
  }

  static validateToken(symbol: string): void {
    if (!this.isValidToken(symbol)) {
      throw new ValidationError(`Unsupported token: ${symbol}`);
    }
  }

  static isValidSlippage(slippageBps: number): boolean {
    return slippageBps >= 0 && slippageBps <= 10000;
  }

  static validateSlippage(slippageBps: number): void {
    if (!this.isValidSlippage(slippageBps)) {
      throw new ValidationError(
        'Invalid slippage: must be between 0 and 10000 basis points'
      );
    }
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[^\w\s.-]/gi, '');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPriorityFee(fee: number): boolean {
    return typeof fee === 'number' && fee >= 0 && fee <= 1000000;
  }

  static validatePriorityFee(fee: number): void {
    if (!this.isValidPriorityFee(fee)) {
      throw new ValidationError(
        'Invalid priority fee: must be between 0 and 1,000,000 lamports'
      );
    }
  }

  static isValidComputeUnits(units: number): boolean {
    return typeof units === 'number' && units > 0 && units <= 1400000;
  }

  static validateComputeUnits(units: number): void {
    if (!this.isValidComputeUnits(units)) {
      throw new ValidationError(
        'Invalid compute units: must be between 1 and 1,400,000'
      );
    }
  }
}
