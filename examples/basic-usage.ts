import { NeyrsClient, LogLevel, PriorityLevel } from '../src';

async function main() {
  const client = new NeyrsClient({
    rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    logLevel: LogLevel.INFO,
    defaultSlippageBps: 50,
    mevProtection: true,
  });

  console.log('=== Neyrs Basic Usage Examples ===\n');

  const walletAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

  console.log('1. Parsing swap intent...');
  const swapIntent = await client.resolveIntent({
    query: 'swap 5 SOL for USDC',
  });
  console.log('Action:', swapIntent.action);
  console.log('Confidence:', swapIntent.confidence);
  console.log('Parameters:', swapIntent.parameters);
  console.log('Processing time:', swapIntent.metadata.processingTimeMs, 'ms\n');

  console.log('2. Parsing send intent...');
  const sendIntent = await client.resolveIntent({
    query: `send 2 SOL to ${walletAddress}`,
  });
  console.log('Action:', sendIntent.action);
  console.log('Parameters:', sendIntent.parameters);
  console.log('');

  console.log('3. Checking balance...');
  const balanceIntent = await client.resolveIntent({
    query: 'show my balance',
  });
  console.log('Action:', balanceIntent.action);
  console.log('');

  console.log('4. Checking token price...');
  const priceIntent = await client.resolveIntent({
    query: "what's the price of SOL",
  });
  console.log('Action:', priceIntent.action);
  console.log('Token:', priceIntent.parameters.tokenA);
  console.log('');

  console.log('5. Risk assessment for swap...');
  const riskAssessment = await client.assessRisk(swapIntent);
  console.log('Risk Level:', riskAssessment.riskLevel);
  console.log('Risk Score:', riskAssessment.score);
  console.log('Flags:', riskAssessment.flags.length);
  console.log('Recommendation:', riskAssessment.recommendation);
  console.log('');

  console.log('6. Building transaction...');
  try {
    const txResult = await client.buildTransaction(
      sendIntent,
      walletAddress,
      {
        priorityLevel: PriorityLevel.MEDIUM,
      }
    );
    console.log('Transaction built successfully');
    console.log('Estimated fee:', txResult.estimatedFee, 'lamports');
    console.log('Instructions:', txResult.metadata.instructions);
    console.log('Build time:', txResult.metadata.buildTimeMs, 'ms');
  } catch (error) {
    console.error('Transaction build failed:', error);
  }

  console.log('\n=== Examples Complete ===');
}

main().catch(console.error);
