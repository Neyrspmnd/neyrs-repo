import axios from 'axios';
import { SwapQuote, RouteInfo } from '../types';
import { NetworkError } from '../core/errors';

export interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}

export class JupiterAggregator {
  private apiEndpoint: string;
  private rpcEndpoint: string;

  constructor(rpcEndpoint: string, apiEndpoint?: string) {
    this.rpcEndpoint = rpcEndpoint;
    this.apiEndpoint = apiEndpoint || 'https://quote-api.jup.ag/v6';
  }

  async getQuote(request: JupiterQuoteRequest): Promise<SwapQuote> {
    try {
      const response = await axios.get(`${this.apiEndpoint}/quote`, {
        params: {
          inputMint: request.inputMint,
          outputMint: request.outputMint,
          amount: request.amount,
          slippageBps: request.slippageBps || 50,
        },
        timeout: 10000,
      });

      return this.parseQuoteResponse(response.data);
    } catch (error) {
      throw new NetworkError(
        'Failed to fetch Jupiter quote',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getSwapTransaction(
    quote: SwapQuote,
    userPublicKey: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/swap`,
        {
          quoteResponse: quote,
          userPublicKey,
          wrapUnwrapSOL: true,
        },
        { timeout: 10000 }
      );

      return response.data.swapTransaction;
    } catch (error) {
      throw new NetworkError(
        'Failed to get swap transaction',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  private parseQuoteResponse(data: any): SwapQuote {
    const routes: RouteInfo[] = (data.routePlan || []).map((route: any) => ({
      ammKey: route.swapInfo?.ammKey || 'unknown',
      label: route.swapInfo?.label || 'Unknown DEX',
      inputMint: route.swapInfo?.inputMint || data.inputMint,
      outputMint: route.swapInfo?.outputMint || data.outputMint,
      inAmount: route.swapInfo?.inAmount || '0',
      outAmount: route.swapInfo?.outAmount || '0',
      feeAmount: route.swapInfo?.feeAmount || '0',
      feeMint: route.swapInfo?.feeMint || data.inputMint,
    }));

    const platformFee = parseInt(data.platformFee?.amount || '0');
    const otherFees = parseInt(data.otherAmountThreshold || '0');

    return {
      inputMint: data.inputMint,
      outputMint: data.outputMint,
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      priceImpactPct: parseFloat(data.priceImpactPct || '0'),
      slippageBps: data.slippageBps || 50,
      route: routes,
      fees: {
        platformFee,
        liquidityProviderFee: otherFees,
        networkFee: 5000,
        total: platformFee + otherFees + 5000,
      },
    };
  }

  async getTokenPrice(mint: string): Promise<number> {
    try {
      const response = await axios.get(`${this.apiEndpoint}/price`, {
        params: { ids: mint },
        timeout: 5000,
      });

      return response.data.data?.[mint]?.price || 0;
    } catch {
      return 0;
    }
  }
}
