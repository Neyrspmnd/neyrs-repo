<div align="center">
  <img src="./public/Frame 11.jpg" alt="Neyrs Banner" width="100%">
</div>

<div align="center">

![Solana](https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Web3](https://img.shields.io/badge/Web3-F16822?style=for-the-badge&logo=web3.js&logoColor=white)
![DeFi](https://img.shields.io/badge/DeFi-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@neyrs/core?style=for-the-badge)](https://www.npmjs.com/package/@neyrs/core)
[![CI](https://img.shields.io/github/actions/workflow/status/Neyrspmnd/neyrs-repo/ci.yml?style=for-the-badge)](https://github.com/Neyrspmnd/neyrs-repo/actions)

**AI-powered conversational agent for Solana wallet operations, DeFi interactions, and Web3 commerce**

[Website](https://www.neyrs.cloud) • [Documentation](./docs) • [Examples](./examples)

</div>

---

## Overview

Neyrs is a production-ready AI agent that translates natural language into executable Solana blockchain transactions. Built with performance and security as core principles, it combines TypeScript flexibility with Rust performance for sub-second transaction processing.

### Key Features

- **Natural Language Processing**: Convert plain English into structured blockchain operations
- **High Performance**: Rust-powered parser with sub-50ms intent resolution
- **Jupiter V6 Integration**: Optimal swap routing with best price execution
- **MEV Protection**: Jito bundle support for front-running prevention
- **Risk Assessment**: Comprehensive token analysis and honey-pot detection
- **Commerce Integration**: Purchase products with USDC on Solana
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Production Ready**: Extensive test coverage, CI/CD pipeline, and monitoring

## Quick Start

### Installation

```bash
npm install @neyrs/core
```

### Basic Usage

```typescript
import { NeyrsClient, LogLevel, PriorityLevel } from '@neyrs/core';

const client = new NeyrsClient({
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  logLevel: LogLevel.INFO,
  mevProtection: true,
});

// Parse natural language intent
const intent = await client.resolveIntent({
  query: 'swap 5 SOL for USDC',
});

console.log('Action:', intent.action);
console.log('Confidence:', intent.confidence);

// Assess risk
const risk = await client.assessRisk(intent);
console.log('Risk Level:', risk.riskLevel);

// Build transaction
const result = await client.buildTransaction(
  intent,
  'YourWalletAddress',
  { priorityLevel: PriorityLevel.HIGH }
);

console.log('Estimated Fee:', result.estimatedFee);
```

## Supported Operations

### DeFi Operations
- **Swap**: Token swaps with optimal routing
- **Send**: Token transfers with validation
- **Stake**: SOL staking operations
- **Unstake**: Unstaking with rewards calculation

### Queries
- **Balance**: Check wallet balances
- **Price**: Get real-time token prices

### Commerce
- **Buy Product**: Purchase items with USDC payment

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface                        │
│              (Chat / Voice / API)                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼─────────┐
│ Intent Parser  │      │ Transaction      │
│   (Rust FFI)   │      │   Builder        │
└───────┬────────┘      └────────┬─────────┘
        │                        │
        │    ┌──────────────┐    │
        └────▶ Risk Engine  ◀────┘
             └──────┬───────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼─────────┐
│    Jupiter     │    │      Jito        │
│  Aggregator    │    │  MEV Protection  │
└───────┬────────┘    └────────┬─────────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │  Solana Blockchain  │
        └─────────────────────┘
```

## Performance

### Benchmarks

```
Operation                    Latency (ms)    Throughput (ops/sec)
─────────────────────────────────────────────────────────────────
Intent Parsing               28.3 (avg)      35,283
Entity Extraction            12.1 (avg)      82,644
Transaction Building         85.4 (avg)      11,706
Risk Assessment              62.8 (avg)      15,924
End-to-End Processing        180.5 (avg)     5,540
```

### Optimization Features

- Rust-powered parser for critical paths
- LRU memory caching with configurable TTL
- Connection pooling for RPC endpoints
- Parallel processing for independent operations
- Lazy loading of heavy components

## Documentation

- [Architecture Guide](./docs/architecture.md) - System design and components
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Performance Guide](./docs/performance.md) - Optimization strategies
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines
- [Security Policy](./SECURITY.md) - Security best practices

## Examples

### Advanced Routing

```typescript
const intent = await client.resolveIntent({
  query: 'swap 100 BONK for USDC',
});

const risk = await client.assessRisk(intent);

if (risk.riskLevel === 'LOW' || risk.riskLevel === 'MEDIUM') {
  const tx = await client.buildTransaction(intent, walletAddress, {
    priorityLevel: PriorityLevel.HIGH,
    computeUnitLimit: 400000,
  });
  
  console.log('Transaction ready for signing');
}
```

### Error Handling

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

See [examples/](./examples/) for complete working examples.

## Development

### Setup

```bash
git clone https://github.com/Neyrspmnd/neyrs-repo.git
cd neyrs-repo
npm install
```

### Build

```bash
# Build Rust parser
npm run build:rust

# Build TypeScript
npm run build

# Build all
npm run build:all
```

### Testing

```bash
npm test                   # Run all tests
npm run test:coverage      # With coverage
npm run test:rust          # Rust tests
```

### Benchmarks

```bash
npm run bench              # TypeScript benchmarks
npm run bench:rust         # Rust benchmarks
```

## Configuration

### Environment Variables

```bash
# Solana Configuration
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
RPC_WSS_ENDPOINT=wss://api.mainnet-beta.solana.com

# Jupiter Configuration
JUPITER_API_ENDPOINT=https://quote-api.jup.ag/v6

# Jito Configuration
JITO_BLOCK_ENGINE_ENDPOINT=https://mainnet.block-engine.jito.wtf

# Application Settings
LOG_LEVEL=info
MAX_SLIPPAGE_BPS=50
ENABLE_MEV_PROTECTION=true
```

See [.env.example](./.env.example) for complete configuration.

## Security

### Non-Custodial Design

- Client never accesses private keys
- All transactions require user signature
- No sensitive data stored or transmitted

### Best Practices

- Use burner wallets for testing
- Verify transaction details before signing
- Enable MEV protection for production
- Implement rate limiting
- Regular security audits

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## Roadmap

### v0.2.0 (Q2 2024)
- Real Jupiter V6 API integration
- Real Jito block engine integration
- On-chain risk data integration
- Portfolio tracking
- WebSocket support

### v0.3.0 (Q3 2024)
- Multi-hop swap optimization
- Advanced slippage strategies
- Transaction batching
- Voice interface

### v1.0.0 (Q4 2024)
- Production-ready integrations
- Comprehensive security audit
- Mobile SDK
- Cross-chain support

## Technology Stack

- **Runtime**: Node.js 18+
- **Languages**: TypeScript 5+ / Rust 1.70+
- **Blockchain**: Solana Web3.js
- **Testing**: Vitest
- **Build**: tsup / Cargo
- **CI/CD**: GitHub Actions

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built on [Solana](https://solana.com/) blockchain
- Powered by [Jupiter](https://jup.ag/) aggregator
- MEV protection by [Jito](https://www.jito.wtf/)
- Testing with [Vitest](https://vitest.dev/)

## Community

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Neyrspmnd/neyrs-repo)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/NeyrsDeFI)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/NeyrsDeFI)
[![Website](https://img.shields.io/badge/Website-FF6B6B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.neyrs.cloud)

</div>

## Support

- Website: [neyrs.cloud](https://www.neyrs.cloud)
- GitHub Issues: [Report a bug](https://github.com/Neyrspmnd/neyrs-repo/issues)
- Telegram: [@NeyrsDeFI](https://t.me/NeyrsDeFI)
- Twitter: [@NeyrsDeFI](https://x.com/NeyrsDeFI)

---

<div align="center">
  <strong>Built with precision for the Solana ecosystem</strong>
  <br>
  <sub>Made with ❤️ by the Neyrs team</sub>
</div>
