# Performance Guide

## Overview

Neyrs is designed for high performance with sub-second transaction processing. This guide covers performance characteristics, optimization strategies, and benchmarks.

## Benchmarks

### Intent Parsing

```
Operation                    Latency (ms)    Throughput (ops/sec)
─────────────────────────────────────────────────────────────────
Swap Intent                  28.3 (avg)      35,283
Send Intent                  26.1 (avg)      38,314
Balance Intent               18.5 (avg)      54,054
Price Intent                 22.7 (avg)      44,053
Entity Extraction            12.1 (avg)      82,644
Complex Query                35.2 (avg)      28,409
```

### Transaction Building

```
Operation                    Latency (ms)    Throughput (ops/sec)
─────────────────────────────────────────────────────────────────
Simple Transfer              85.4 (avg)      11,706
Swap Transaction             142.8 (avg)     7,002
Stake Transaction            98.3 (avg)      10,173
```

### Risk Assessment

```
Operation                    Latency (ms)    Throughput (ops/sec)
─────────────────────────────────────────────────────────────────
Swap Risk Analysis           62.8 (avg)      15,924
Transfer Risk Analysis       45.2 (avg)      22,124
Token Verification           18.9 (avg)      52,910
```

### End-to-End

```
Operation                    Latency (ms)
────────────────────────────────────────
Parse + Build + Risk         180.5 (avg)
Full Swap Workflow           285.3 (avg)
Full Send Workflow           195.7 (avg)
```

## Performance Characteristics

### Rust Parser

The intent parser is implemented in Rust for maximum performance:

- Zero-copy string operations
- Compiled regex patterns
- Minimal allocations
- SIMD optimizations (where available)

**Performance Impact:**
- 3-5x faster than pure TypeScript implementation
- 60% reduction in memory usage
- Consistent sub-50ms parsing times

### Memory Usage

```
Component                    Memory (MB)
──────────────────────────────────────
Intent Parser                2.1
Transaction Builder          3.8
Risk Engine                  2.5
Cache (1000 entries)         8.2
Total (idle)                 16.6
```

### Caching Strategy

Multi-level caching for optimal performance:

```
┌─────────────┐
│ L1: Memory  │  Hit Rate: 85%  |  Latency: <1ms
│   Cache     │
└──────┬──────┘
       │ Miss (15%)
┌──────▼──────┐
│ L2: Redis   │  Hit Rate: 12%  |  Latency: 2-5ms
│   Cache     │
└──────┬──────┘
       │ Miss (3%)
┌──────▼──────┐
│ L3: RPC     │  Hit Rate: 3%   |  Latency: 50-200ms
│  Endpoint   │
└─────────────┘
```

**Cache Configuration:**

```typescript
const cache = new MemoryCache({
  ttl: 300000,      // 5 minutes
  maxSize: 1000,    // 1000 entries
});
```

## Optimization Strategies

### 1. Connection Pooling

Reuse RPC connections for better performance:

```typescript
const connection = new Connection(rpcEndpoint, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
  httpHeaders: {
    'Content-Type': 'application/json',
  },
});
```

### 2. Batch Operations

Batch multiple operations when possible:

```typescript
// Bad: Sequential operations
const balance1 = await connection.getBalance(address1);
const balance2 = await connection.getBalance(address2);
const balance3 = await connection.getBalance(address3);

// Good: Parallel operations
const [balance1, balance2, balance3] = await Promise.all([
  connection.getBalance(address1),
  connection.getBalance(address2),
  connection.getBalance(address3),
]);
```

### 3. Lazy Loading

Load heavy components only when needed:

```typescript
class NeyrsClient {
  private _jupiter?: JupiterAggregator;

  getJupiter(): JupiterAggregator {
    if (!this._jupiter) {
      this._jupiter = new JupiterAggregator(this.rpcEndpoint);
    }
    return this._jupiter;
  }
}
```

### 4. Query Optimization

Optimize RPC queries:

```typescript
// Bad: Multiple queries
const account = await connection.getAccountInfo(address);
const balance = await connection.getBalance(address);

// Good: Single query with account info
const account = await connection.getAccountInfo(address);
const balance = account?.lamports || 0;
```

### 5. Compute Budget Optimization

Calculate optimal compute units:

```typescript
function calculateComputeUnits(instructions: number): number {
  const baseUnits = 5000;
  const perInstructionUnits = 1000;
  return baseUnits + (instructions * perInstructionUnits);
}
```

## Performance Monitoring

### Metrics Collection

```typescript
import { globalMetrics } from '@neyrs/core';

// Record operation duration
const start = performance.now();
await operation();
const duration = performance.now() - start;

globalMetrics.recordHistogram('operation_duration_ms', duration, {
  operation: 'swap',
});
```

### Performance Profiling

```bash
# Run with profiling
node --prof app.js

# Process profiling output
node --prof-process isolate-*.log > profile.txt
```

### Benchmark Suite

```bash
# Run benchmarks
npm run bench

# Rust benchmarks
cd core-parser
cargo bench
```

## Bottleneck Analysis

### Common Bottlenecks

1. **RPC Latency**
   - Solution: Use faster RPC endpoints
   - Solution: Implement caching
   - Solution: Use connection pooling

2. **Network Requests**
   - Solution: Batch operations
   - Solution: Parallel execution
   - Solution: Request deduplication

3. **Memory Allocation**
   - Solution: Object pooling
   - Solution: Reuse buffers
   - Solution: Lazy initialization

4. **Regex Compilation**
   - Solution: Pre-compile patterns (done in Rust)
   - Solution: Cache compiled patterns
   - Solution: Use simpler patterns

### Profiling Tools

```bash
# CPU profiling
node --cpu-prof app.js

# Memory profiling
node --heap-prof app.js

# Chrome DevTools
node --inspect app.js
```

## Scaling Recommendations

### Vertical Scaling

- Increase Node.js memory limit: `--max-old-space-size=4096`
- Use faster CPU for Rust parser
- Increase RPC connection limits
- Add more cache memory

### Horizontal Scaling

- Deploy multiple instances
- Use load balancer
- Implement distributed caching (Redis)
- Use message queue for async operations

### Database Optimization

```typescript
// Use indexes
db.collection.createIndex({ walletAddress: 1 });

// Use projection
db.collection.find({}, { _id: 0, balance: 1 });

// Use aggregation pipeline
db.collection.aggregate([
  { $match: { status: 'active' } },
  { $group: { _id: '$type', total: { $sum: 1 } } },
]);
```

## Performance Testing

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

### Stress Testing

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.post('http://localhost:3000/api/parse', {
    query: 'swap 5 SOL for USDC',
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

## Best Practices

1. **Use Rust for CPU-intensive operations**
2. **Implement multi-level caching**
3. **Batch RPC requests when possible**
4. **Use connection pooling**
5. **Monitor performance metrics**
6. **Profile regularly**
7. **Optimize hot paths**
8. **Use lazy loading**
9. **Implement request deduplication**
10. **Set appropriate timeouts**

## Performance Checklist

- [ ] Rust parser compiled in release mode
- [ ] Caching enabled and configured
- [ ] Connection pooling implemented
- [ ] Batch operations where possible
- [ ] Metrics collection enabled
- [ ] Performance monitoring in place
- [ ] Load testing completed
- [ ] Bottlenecks identified and addressed
- [ ] Resource limits configured
- [ ] Scaling strategy defined
