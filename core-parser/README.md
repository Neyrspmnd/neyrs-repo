# Neyrs Parser (Rust)

High-performance intent parsing engine written in Rust.

## Features

- Sub-50ms parsing times
- Zero-copy string operations
- Compiled regex patterns
- Comprehensive entity extraction
- FFI bindings for TypeScript

## Building

```bash
cargo build --release
```

## Testing

```bash
cargo test
```

## Benchmarking

```bash
cargo bench
```

## Performance

- Average parsing time: 28ms
- Throughput: 35,000+ ops/sec
- Memory efficient with minimal allocations

## Usage from TypeScript

```typescript
import { IntentParser } from '@neyrs/core';

const parser = new IntentParser();
const intent = await parser.parse('swap 5 SOL for USDC');
```

## Supported Intents

- SWAP - Token swaps
- SEND - Token transfers
- STAKE - Staking operations
- UNSTAKE - Unstaking operations
- BALANCE - Balance queries
- PRICE - Price queries
- BUY_PRODUCT - Product purchases

## Entity Types

- TOKEN - Token symbols (SOL, USDC, etc.)
- AMOUNT - Numeric amounts
- ADDRESS - Solana addresses
- VALIDATOR - Validator addresses
- PRODUCT - Product names

## License

MIT
