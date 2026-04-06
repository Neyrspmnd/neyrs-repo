import { NeyrsClient, LogLevel, PriorityLevel } from '../src';

async function main() {
  console.log('=== Advanced Routing Examples ===\n');

  const client = new NeyrsClient({
    rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    logLevel: LogLevel.DEBUG,
    mevProtection: true,
  });

  const walletAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

  console.log('1. Complex swap with risk assessment...');
  const swapIntent = await client.resolveIntent({
    query: 'swap 100 BONK for USDC',
  });

  console.log('Intent:', swapIntent.action);
  console.log('Parameters:', swapIntent.parameters);

  const riskAssessment = await client.assessRisk(swapIntent);
  console.log('\nRisk Assessment:');
  console.log('  Level:', riskAssessment.riskLevel);
  console.log('  Score:', riskAssessment.score);
  console.log('  Flags:', riskAssessment.flags.length);
  
  if (riskAssessment.flags.length > 0) {
    console.log('\n  Risk Flags:');
    riskAssessment.flags.forEach((flag) => {
      console.log(`    - [${flag.severity}] ${flag.message}`);
    });
  }

  console.log('\n  Recommendation:', riskAssessment.recommendation);

  if (riskAssessment.riskLevel === 'LOW' || riskAssessment.riskLevel === 'MEDIUM') {
    console.log('\n2. Building transaction with high priority...');
    
    try {
      const txResult = await client.buildTransaction(
        swapIntent,
        walletAddress,
        {
          priorityLevel: PriorityLevel.HIGH,
          computeUnitLimit: 400000,
        }
      );

      console.log('Transaction Details:');
      console.log('  Instructions:', txResult.metadata.instructions);
      console.log('  Estimated Fee:', txResult.estimatedFee, 'lamports');
      console.log('  Compute Units:', txResult.computeUnits);
      console.log('  Priority Fee:', txResult.priorityFee, 'micro-lamports');
      console.log('  Build Time:', txResult.metadata.buildTimeMs.toFixed(2), 'ms');
    } catch (error) {
      console.error('Transaction build failed:', error);
    }
  } else {
    console.log('\n⚠️  Transaction cancelled due to high risk');
  }

  console.log('\n3. Multi-step workflow...');
  
  const steps = [
    'check balance',
    "what's the price of SOL",
    'swap 1 SOL for USDC',
  ];

  for (const step of steps) {
    console.log(`\n  Step: "${step}"`);
    const intent = await client.resolveIntent({ query: step });
    console.log(`  Action: ${intent.action}`);
    console.log(`  Confidence: ${intent.confidence.toFixed(2)}`);
    console.log(`  Processing: ${intent.metadata.processingTimeMs.toFixed(2)}ms`);
  }

  console.log('\n4. Error handling example...');
  
  try {
    const invalidIntent = await client.resolveIntent({
      query: 'send 1000000 SOL to invalid_address',
    });

    console.log('Intent parsed:', invalidIntent.action);

    const txResult = await client.buildTransaction(
      invalidIntent,
      walletAddress
    );
    
    console.log('Transaction built (unexpected)');
  } catch (error) {
    console.log('Expected error caught:', (error as Error).message);
  }

  console.log('\n5. Jupiter integration example...');
  
  const jupiter = client.getJupiter();
  
  try {
    const price = await jupiter.getTokenPrice(
      'So11111111111111111111111111111111111111112'
    );
    console.log('SOL Price:', price > 0 ? `$${price.toFixed(2)}` : 'N/A');
  } catch (error) {
    console.log('Price fetch failed (expected in test environment)');
  }

  console.log('\n6. Jito MEV protection example...');
  
  const jito = client.getJito();
  
  if (jito) {
    console.log('MEV Protection: Enabled');
    const optimalTip = jito.calculateOptimalTip('MEDIUM');
    console.log('Optimal Tip (MEDIUM):', optimalTip, 'lamports');
  } else {
    console.log('MEV Protection: Disabled');
  }

  console.log('\n=== Advanced Examples Complete ===');
}

main().catch(console.error);
