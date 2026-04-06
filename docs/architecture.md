# Architecture

## Overview

Neyrs is a conversational AI agent for Solana blockchain operations, designed with performance, security, and extensibility as core principles.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface                        │
│              (Chat / Voice / API)                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼─────────┐
│ Intent Parser  │      │   AI Context     │
│   (Rust FFI)   │      │    Manager       │
└───────┬────────┘      └────────┬─────────┘
        │                        │
        │    ┌──────────────┐    │
        └────▶ Risk Engine  ◀────┘
             └──────┬───────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼─────────┐
│  Transaction   │    │   Commerce       │
│    Builder     │    │   Integration    │
└───────┬────────┘    └────────┬─────────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │  Integration Layer  │
        ├─────────────────────┤
        │ Jupiter | Jito      │
        │ Solana  | Amazon    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Blockchain Layer   │
        │   (Solana RPC)      │
        └─────────────────────┘
```

## Core Components

### 1. Intent Parser (Rust)

High-performance natural language processing engine written in Rust for sub-50ms parsing.

**Responsibilities:**
- Parse natural language queries
- Extract entities (tokens, amounts, addresses)
- Determine intent action with confidence score
- Handle multiple language patterns

**Technology:**
- Rust for performance-critical path
- Regex-based pattern matching
- Entity extraction with position tracking
- FFI bindings for TypeScript integration

**Performance:**
- Average parsing time: 28ms
- Throughput: 35,000+ ops/sec
- Memory efficient with zero-copy operations

### 2. Transaction Builder

Constructs Solana transactions with optimal compute budget allocation.

**Features:**
- Dynamic compute unit calculation
- Priority fee optimization
- Multi-instruction transaction support
- Versioned transaction support

**Optimization Strategies:**
- Compute budget pre-calculation
- Instruction batching
- Fee estimation with fallback
- Recent blockhash caching

### 3. Risk Assessment Engine

Evaluates transaction risk before execution.

**Risk Factors:**
- Token verification status
- Liquidity depth analysis
- Holder distribution
- Historical activity patterns
- Honey-pot detection

**Risk Levels:**
- LOW: Safe to proceed
- MEDIUM: Review recommended
- HIGH: Proceed with caution
- CRITICAL: Strong recommendation to cancel

### 4. Integration Layer

#### Jupiter V6 Aggregator
- Optimal swap routing
- Price impact calculation
- Multi-hop route optimization
- Slippage protection

#### Jito MEV Protection
- Bundle transaction support
- Front-running prevention
- Sandwich attack mitigation
- Optimal tip calculation

#### Commerce Integration
- Product search and discovery
- Price conversion (USD to USDC)
- Order placement and tracking
- Payment processing

## Data Flow

### Swap Transaction Flow

```
1. User Query
   "swap 5 SOL for USDC"
   │
   ▼
2. Intent Parser (Rust)
   - Parse query
   - Extract: amount=5, tokenA=SOL, tokenB=USDC
   - Action: SWAP, Confidence: 0.95
   │
   ▼
3. Risk Assessment
   - Check token verification
   - Analyze liquidity
   - Calculate risk score
   │
   ▼
4. Jupiter Quote
   - Get optimal route
   - Calculate price impact
   - Estimate output amount
   │
   ▼
5. Transaction Builder
   - Create swap instructions
   - Add compute budget
   - Set priority fee
   │
   ▼
6. Jito Bundle (Optional)
   - Wrap in MEV-protected bundle
   - Add tip transaction
   │
   ▼
7. User Approval
   - Display transaction details
   - Request signature
   │
   ▼
8. Execution
   - Send to Solana network
   - Monitor confirmation
   │
   ▼
9. Result
   - Success/Failure notification
   - Transaction signature
```

## Design Patterns

### Factory Pattern

```typescript
class TransactionFactory {
  static create(intent: ParsedIntent): TransactionBuilder {
    switch (intent.action) {
      case 'SWAP':
        return new SwapTransactionBuilder();
      case 'SEND':
        return new SendTransactionBuilder();
      case 'STAKE':
        return new StakeTransactionBuilder();
      default:
        throw new Error('Unsupported action');
    }
  }
}
```

### Strategy Pattern

```typescript
interface RiskStrategy {
  assess(params: RiskParams): RiskAssessment;
}

class SwapRiskStrategy implements RiskStrategy {
  assess(params: SwapParams): RiskAssessment {
    // Swap-specific risk logic
  }
}

class TransferRiskStrategy implements RiskStrategy {
  assess(params: TransferParams): RiskAssessment {
    // Transfer-specific risk logic
  }
}
```

### Observer Pattern

```typescript
class TransactionMonitor {
  private observers: TransactionObserver[] = [];

  subscribe(observer: TransactionObserver): void {
    this.observers.push(observer);
  }

  notify(event: TransactionEvent): void {
    this.observers.forEach(obs => obs.update(event));
  }
}
```

## Scalability Considerations

### Horizontal Scaling
- Stateless design for easy replication
- Load balancing across multiple instances
- Distributed caching with Redis
- Message queue for async operations

### Vertical Scaling
- Rust parser for CPU-intensive operations
- Connection pooling for RPC endpoints
- Memory-efficient data structures
- Lazy loading of heavy components

### Caching Strategy

```
┌─────────────┐
│ L1: Memory  │  (Fast, Small, 5min TTL)
│   Cache     │
└──────┬──────┘
       │ Miss
┌──────▼──────┐
│ L2: Redis   │  (Medium, Large, 1hr TTL)
│   Cache     │
└──────┬──────┘
       │ Miss
┌──────▼──────┐
│ L3: RPC     │  (Slow, Authoritative)
│  Endpoint   │
└─────────────┘
```

## Security Architecture

### Authentication & Authorization
- Non-custodial design (no private key access)
- Transaction signing by user wallet
- API key authentication for services
- Rate limiting per user/IP

### Input Validation
- Address format validation
- Amount range checks
- Token symbol verification
- Query sanitization

### Transaction Security
- Risk assessment before execution
- Slippage protection
- MEV protection via Jito
- Transaction simulation before signing

## Performance Optimization

### Query Optimization
- Rust parser for critical path
- Regex compilation caching
- Entity extraction parallelization

### Connection Pooling
```typescript
const pool = new ConnectionPool({
  min: 2,
  max: 10,
  acquireTimeout: 30000,
  idleTimeout: 30000,
});
```

### Batch Operations
- Multiple RPC calls in single request
- Transaction instruction batching
- Parallel risk assessments

## Monitoring & Observability

### Metrics Collection
- Request duration histograms
- Error rate counters
- Intent parsing performance
- Transaction success rate

### Logging Strategy
- Structured JSON logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Context propagation
- Sensitive data redaction

### Health Checks
- RPC endpoint availability
- Integration service status
- Cache hit rates
- Memory usage monitoring

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+ / Rust 1.70+
- **Blockchain**: Solana Web3.js
- **Testing**: Vitest
- **Build**: tsup
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## Future Enhancements

### Phase 1 (Q2 2024)
- Real-time price feeds
- WebSocket support
- Multi-wallet management
- Transaction history

### Phase 2 (Q3 2024)
- AI conversation context
- Multi-language support
- Voice interface
- Mobile SDK

### Phase 3 (Q4 2024)
- Cross-chain support
- DeFi strategy automation
- Portfolio analytics
- Social trading features
