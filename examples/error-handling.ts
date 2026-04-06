import {
  NeyrsClient,
  LogLevel,
  ValidationError,
  ParseError,
  TransactionError,
  NetworkError,
} from '../src';

async function main() {
  console.log('=== Error Handling Examples ===\n');

  const client = new NeyrsClient({
    rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    logLevel: LogLevel.INFO,
  });

  console.log('1. Handling empty query...');
  try {
    await client.resolveIntent({ query: '' });
  } catch (error) {
    if (error instanceof ParseError) {
      console.log('✓ ParseError caught:', error.message);
      console.log('  Code:', error.code);
      console.log('  Status:', error.statusCode);
    }
  }

  console.log('\n2. Handling invalid address...');
  try {
    const intent = await client.resolveIntent({
      query: 'send 1 SOL to invalid_address_format',
    });

    await client.buildTransaction(
      intent,
      'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✓ ValidationError caught:', error.message);
      console.log('  Details:', error.details);
    } else if (error instanceof TransactionError) {
      console.log('✓ TransactionError caught:', error.message);
    }
  }

  console.log('\n3. Handling low confidence intent...');
  try {
    const intent = await client.resolveIntent({
      query: 'random gibberish that makes no sense',
    });

    console.log('Intent action:', intent.action);
    console.log('Confidence:', intent.confidence);

    if (intent.confidence < 0.7) {
      console.log('✓ Low confidence detected, transaction cancelled');
    }
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }

  console.log('\n4. Handling network errors...');
  try {
    const badClient = new NeyrsClient({
      rpcEndpoint: 'https://invalid-endpoint-that-does-not-exist.com',
      logLevel: LogLevel.ERROR,
    });

    await badClient.getBalance('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('✓ NetworkError caught:', error.message);
    } else {
      console.log('✓ Network error caught:', (error as Error).message);
    }
  }

  console.log('\n5. Graceful degradation example...');
  
  const queries = [
    'swap 5 SOL for USDC',
    'invalid query here',
    'send 2 SOL to DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    '',
    'check balance',
  ];

  for (const query of queries) {
    try {
      const intent = await client.resolveIntent({ query });
      console.log(`✓ "${query.substring(0, 30)}..." -> ${intent.action}`);
    } catch (error) {
      console.log(`✗ "${query.substring(0, 30)}..." -> Error: ${(error as Error).message}`);
    }
  }

  console.log('\n6. Error recovery pattern...');
  
  async function executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.log(`  Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          console.log(`  Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  try {
    const result = await executeWithRetry(async () => {
      const intent = await client.resolveIntent({
        query: 'swap 5 SOL for USDC',
      });
      return intent;
    });

    console.log('✓ Operation succeeded:', result.action);
  } catch (error) {
    console.log('✗ All retries failed');
  }

  console.log('\n7. Custom error handling...');
  
  class CustomErrorHandler {
    handle(error: Error): void {
      if (error instanceof ValidationError) {
        console.log('[VALIDATION] User input error:', error.message);
        console.log('  Suggestion: Check your input format');
      } else if (error instanceof ParseError) {
        console.log('[PARSE] Could not understand query:', error.message);
        console.log('  Suggestion: Try rephrasing your request');
      } else if (error instanceof TransactionError) {
        console.log('[TRANSACTION] Transaction failed:', error.message);
        console.log('  Suggestion: Check your wallet balance and try again');
      } else if (error instanceof NetworkError) {
        console.log('[NETWORK] Connection issue:', error.message);
        console.log('  Suggestion: Check your internet connection');
      } else {
        console.log('[UNKNOWN] Unexpected error:', error.message);
        console.log('  Suggestion: Contact support');
      }
    }
  }

  const errorHandler = new CustomErrorHandler();

  try {
    await client.resolveIntent({ query: '' });
  } catch (error) {
    errorHandler.handle(error as Error);
  }

  console.log('\n=== Error Handling Examples Complete ===');
}

main().catch(console.error);
