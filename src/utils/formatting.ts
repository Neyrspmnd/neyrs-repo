export class Formatter {
  static formatSol(lamports: number): string {
    const sol = lamports / 1e9;
    return `${sol.toFixed(4)} SOL`;
  }

  static formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  static formatToken(amount: number, decimals: number, symbol: string): string {
    const value = amount / Math.pow(10, decimals);
    return `${value.toFixed(decimals)} ${symbol}`;
  }

  static formatPercentage(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  static formatNumber(value: number, decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  static formatAddress(address: string, chars = 4): string {
    if (address.length <= chars * 2) {
      return address;
    }
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString();
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${(ms / 60000).toFixed(2)}m`;
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
  }

  static formatBps(bps: number): string {
    return `${(bps / 100).toFixed(2)}%`;
  }

  static formatLamports(lamports: number, decimals = 4): string {
    return `${(lamports / 1e9).toFixed(decimals)}`;
  }

  static formatCompactNumber(value: number): string {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
  }
}
