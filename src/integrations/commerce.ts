import axios from 'axios';
import {
  Product,
  ProductSearchResult,
  PurchaseRequest,
  PurchaseResult,
} from '../types';
import { CommerceError } from '../core/errors';

export interface AmazonConfig {
  apiKey: string;
  partnerTag: string;
  region?: string;
}

export class AmazonIntegration {
  private apiKey: string;
  private partnerTag: string;
  private region: string;
  private apiEndpoint: string;

  constructor(config: AmazonConfig) {
    this.apiKey = config.apiKey;
    this.partnerTag = config.partnerTag;
    this.region = config.region || 'US';
    this.apiEndpoint = 'https://api.amazon.com/paapi5';
  }

  async searchProducts(query: string, maxResults = 10): Promise<ProductSearchResult> {
    const startTime = performance.now();

    try {
      const response = await axios.post(
        `${this.apiEndpoint}/searchitems`,
        {
          Keywords: query,
          Resources: [
            'Images.Primary.Large',
            'ItemInfo.Title',
            'ItemInfo.Features',
            'Offers.Listings.Price',
          ],
          PartnerTag: this.partnerTag,
          PartnerType: 'Associates',
          Marketplace: `www.amazon.${this.region.toLowerCase()}`,
          ItemCount: maxResults,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      const products = this.parseSearchResponse(response.data);
      const processingTimeMs = performance.now() - startTime;

      return {
        products,
        totalResults: products.length,
        query,
        processingTimeMs,
      };
    } catch (error) {
      throw new CommerceError(
        'Failed to search products',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getProductDetails(productId: string): Promise<Product> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/getitems`,
        {
          ItemIds: [productId],
          Resources: [
            'Images.Primary.Large',
            'ItemInfo.Title',
            'ItemInfo.Features',
            'Offers.Listings.Price',
            'CustomerReviews.StarRating',
            'CustomerReviews.Count',
          ],
          PartnerTag: this.partnerTag,
          PartnerType: 'Associates',
          Marketplace: `www.amazon.${this.region.toLowerCase()}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      return this.parseProductResponse(response.data.ItemsResult.Items[0]);
    } catch (error) {
      throw new CommerceError(
        'Failed to get product details',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async purchaseProduct(request: PurchaseRequest): Promise<PurchaseResult> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/purchase`,
        {
          productId: request.productId,
          quantity: request.quantity,
          paymentMethod: request.paymentMethod,
          shippingAddress: request.shippingAddress,
          walletAddress: request.walletAddress,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      return {
        orderId: response.data.orderId,
        status: 'PENDING',
        transactionSignature: response.data.transactionSignature,
        estimatedDelivery: response.data.estimatedDelivery,
      };
    } catch (error) {
      throw new CommerceError(
        'Failed to purchase product',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getOrderStatus(orderId: string): Promise<PurchaseResult> {
    try {
      const response = await axios.get(
        `${this.apiEndpoint}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      return {
        orderId: response.data.orderId,
        status: response.data.status,
        transactionSignature: response.data.transactionSignature,
        estimatedDelivery: response.data.estimatedDelivery,
        trackingNumber: response.data.trackingNumber,
      };
    } catch (error) {
      throw new CommerceError(
        'Failed to get order status',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  private parseSearchResponse(data: any): Product[] {
    if (!data.SearchResult?.Items) {
      return [];
    }

    return data.SearchResult.Items.map((item: any) => this.parseProductResponse(item));
  }

  private parseProductResponse(item: any): Product {
    const price = item.Offers?.Listings?.[0]?.Price;
    const priceAmount = price?.Amount || 0;
    const priceCurrency = price?.Currency || 'USD';

    const usdcRate = 1.0;
    const usdcEquivalent = priceAmount * usdcRate;

    return {
      id: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      description: item.ItemInfo?.Features?.DisplayValues?.join(', ') || '',
      price: {
        amount: priceAmount,
        currency: priceCurrency,
        usdcEquivalent,
      },
      imageUrl: item.Images?.Primary?.Large?.URL || '',
      rating: item.CustomerReviews?.StarRating?.Value || undefined,
      reviewCount: item.CustomerReviews?.Count || undefined,
      availability: this.parseAvailability(item.Offers?.Listings?.[0]?.Availability),
      url: item.DetailPageURL || '',
    };
  }

  private parseAvailability(availability: any): 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' {
    if (!availability) return 'OUT_OF_STOCK';

    const message = availability.Message?.toLowerCase() || '';

    if (message.includes('in stock')) return 'IN_STOCK';
    if (message.includes('pre-order') || message.includes('preorder')) return 'PREORDER';
    return 'OUT_OF_STOCK';
  }

  convertUsdToUsdc(usdAmount: number): number {
    const usdcRate = 1.0;
    return usdAmount * usdcRate;
  }
}
