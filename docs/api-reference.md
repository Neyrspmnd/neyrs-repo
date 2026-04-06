# API Reference

Complete API documentation for Neyrs Core.

## Table of Contents

- [NeyrsClient](#neyrsclient)
- [Intent Parser](#intent-parser)
- [Transaction Builder](#transaction-builder)
- [Risk Assessment](#risk-assessment)
- [Integrations](#integrations)
- [Types](#types)

---

## NeyrsClient

Main client for interacting with Neyrs.

### Constructor

```typescript
new NeyrsClient(config: NeyrsClientConfig): NeyrsClient
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| config.rpcEndpoint | string | Yes | Solana RPC endpoint URL |
| config.logLevel | LogLevel | No | Logging level (default: INFO) |
| config.defaultSlippageBps | number | No | Default slippage in basis points (default: 50) |
| config.mevProtection | boolean | No | Enable MEV protection (default: true) |
| config.jupiterEndpoint | string | No | Jupiter API endpoint |
| config.jitoEndpoint | string | No | Jito block engine endpoint |

**Example:**

```typescript
import { NeyrsClient, LogLevel } from '@neyrs/core';

const client = new NeyrsClient({
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  logLevel: LogLevel.INFO,
  mevProtection: true,
});
```

### Methods

#### resolveIntent()

```typescript
client.resolveIntent(options: { query: string }): Promise<ParsedIntent>
```

Parses natural language query into structured intent.

**Parameters:**

```typescript
interface ResolveIntentOptions {
  query: string; // Natural language query
}
```

**Returns:**

```typescript
interface ParsedIntent {
  action: IntentAction;
  parameters: IntentParameters;
  confidence: number;
  metadata: IntentMetadata;
}
```

**Example:**

```typescript
const intent = await client.resolveIntent({
  query: 'swap 5 SOL for USDC',
});

console.log(intent.action); // 'SWAP'
console.log(intent.parameters); // { amount: 5, tokenA: 'SOL', tokenB: 'USDC' }
console.log(intent.confidence); // 0.95
```

**Throws:**
- `ParseError` - If query cannot be parsed

---

#### buildTransaction()

```typescript
client.buildTransaction(
  intent: ParsedIntent,
  walletAddress: string,
  options?: TransactionOptions
): Promise<TransactionBuildResult>
```

Builds Solana transaction from parsed intent.

**Parameters:**

```typescript
interface TransactionOptions {
  priorityLevel?: PriorityLevel;
  computeUnitLimit?: number;
  computeUnitPrice?: number;
  skipPreflight?: boolean;
  maxRetries?: number;
}
```

**Returns:**

```typescript
interface TransactionBuildResult {
  transaction: Transaction | VersionedTransaction;
  estimatedFee: number;
  computeUnits: number;
  priorityFee: number;
  metadata: TransactionMetadata;
}
```

**Example:**

```typescript
const result = await client.buildTransaction(
  intent,
  'YourWalletAddress',
  {
    priorityLevel: PriorityLevel.HIGH,
    computeUnitLimit: 400000,
  }
);

console.log('Estimated fee:', result.estimatedFee);
console.log('Instructions:', result.metadata.instructions);
```

**Throws:**
- `ValidationError` - Invalid parameters
- `TransactionError` - Transaction build failed

---

#### assessRisk()

```typescript
client.assessRisk(intent: ParsedIntent): Promise<RiskAssessment>
```

Evaluates risk for transaction.

**Returns:**

```typescript
interface RiskAssessment {
  riskLevel: RiskLevel;
  score: number;
  flags: RiskFlag[];
  recommendation: string;
  details: RiskDetails;
}
```

**Example:**

```typescript
const risk = await client.assessRisk(intent);

console.log('Risk Level:', risk.riskLevel);
console.log('Score:', risk.score);
console.log('Recommendation:', risk.recommendation);

if (risk.riskLevel === 'CRITICAL') {
  console.log('Transaction cancelled due to high risk');
  return;
}
```

---

#### getBalance()

```typescript
client.getBalance(walletAddress: string): Promise<number>
```

Fetches SOL balance for wallet.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| walletAddress | string | Yes | Solana wallet address |

**Returns:** Balance in lamports

**Example:**

```typescript
const balance = await client.getBalance('YourWalletAddress');
console.log('Balance:', balance / 1e9, 'SOL');
```

---

#### getTokenPrice()

```typescript
client.getTokenPrice(symbol: string): Promise<number>
```

Fetches current token price in USD.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | string | Yes | Token symbol (SOL, USDC, etc.) |

**Returns:** Price in USD

**Example:**

```typescript
const price = await client.getTokenPrice('SOL');
console.log('SOL Price:', `$${price.toFixed(2)}`);
```

---

## Intent Parser

High-performance intent parsing engine.

### Constructor

```typescript
new IntentParser(): IntentParser
```

### Methods

#### parse()

```typescript
parser.parse(query: string): Promise<ParsedIntent>
```

Parses natural language query.

**Supported Actions:**
- SWAP - Token swaps
- SEND - Token transfers
- STAKE - Staking operations
- UNSTAKE - Unstaking operations
- BALANCE - Balance queries
- PRICE - Price queries
- BUY_PRODUCT - Product purchases

**Example:**

```typescript
import { IntentParser } from '@neyrs/core';

const parser = new IntentParser();
const intent = await parser.parse('swap 5 SOL for USDC');
```

---

## Transaction Builder

Constructs Solana transactions.

### Constructor

```typescript
new TransactionBuilder(rpcEndpoint: string): TransactionBuilder
```

### Methods

#### build()

```typescript
builder.build(
  intent: ParsedIntent,
  walletAddress: string,
  options?: TransactionOptions
): Promise<TransactionBuildResult>
```

Builds transaction from intent.

**Priority Levels:**
- NONE - No priority fee (0 micro-lamports)
- LOW - Low priority (1,000 micro-lamports)
- MEDIUM - Medium priority (5,000 micro-lamports)
- HIGH - High priority (10,000 micro-lamports)
- VERY_HIGH - Very high priority (50,000 micro-lamports)

---

## Risk Assessment

Evaluates transaction risk.

### Constructor

```typescript
new RiskAssessmentEngine(rpcEndpoint: string): RiskAssessmentEngine
```

### Methods

#### assessSwapRisk()

```typescript
engine.assessSwapRisk(
  inputToken: string,
  outputToken: string,
  amount: number
): Promise<RiskAssessment>
```

Assesses risk for token swap.

**Risk Flags:**
- INSUFFICIENT_LIQUIDITY
- HIGH_PRICE_IMPACT
- UNVERIFIED_TOKEN
- HONEYPOT_DETECTED
- SUSPICIOUS_ACTIVITY
- LOW_HOLDER_COUNT
- CONCENTRATED_OWNERSHIP

---

#### assessTransferRisk()

```typescript
engine.assessTransferRisk(
  recipient: string,
  amount: number
): Promise<RiskAssessment>
```

Assesses risk for token transfer.

---

## Integrations

### Jupiter Aggregator

```typescript
import { JupiterAggregator } from '@neyrs/core/integrations';

const jupiter = new JupiterAggregator(rpcEndpoint);

const quote = await jupiter.getQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '5000000000',
  slippageBps: 50,
});
```

### Jito MEV Protection

```typescript
import { JitoMEVProtection } from '@neyrs/core/integrations';

const jito = new JitoMEVProtection(rpcEndpoint);

const bundle = await jito.sendBundle({
  transactions: [transaction],
  tipAmount: 10000,
});

await jito.waitForBundleConfirmation(bundle.bundleId);
```

---

## Types

### IntentAction

```typescript
enum IntentAction {
  SWAP = 'SWAP',
  SEND = 'SEND',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  BALANCE = 'BALANCE',
  PRICE = 'PRICE',
  BUY_PRODUCT = 'BUY_PRODUCT',
  UNKNOWN = 'UNKNOWN',
}
```

### PriorityLevel

```typescript
enum PriorityLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}
```

### RiskLevel

```typescript
enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
```

### LogLevel

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}
```

---

## Error Handling

### Error Types

```typescript
class NeyrsError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;
}

class ValidationError extends NeyrsError {}
class ParseError extends NeyrsError {}
class TransactionError extends NeyrsError {}
class NetworkError extends NeyrsError {}
class RateLimitError extends NeyrsError {}
class CommerceError extends NeyrsError {}
class AIServiceError extends NeyrsError {}
```

### Example

```typescript
try {
  const intent = await client.resolveIntent({ query: '' });
} catch (error) {
  if (error instanceof ParseError) {
    console.log('Parse error:', error.message);
  } else if (error instanceof ValidationError) {
    console.log('Validation error:', error.message);
  }
}
```

---

## Rate Limiting

Default rate limits:
- 100 requests per minute per client
- 1000 requests per hour per client

---

## Examples

See [examples/](../examples/) directory for complete working examples:

- [Basic Usage](../examples/basic-usage.ts)
- [Advanced Routing](../examples/advanced-routing.ts)
- [Error Handling](../examples/error-handling.ts)
