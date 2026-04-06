# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Real Jupiter V6 API integration
- Real Jito block engine integration
- Commerce integration with Amazon API
- AI-powered conversation context
- Multi-language support

## [0.1.0] - 2024-01-10

### Added
- Initial project setup and configuration
- Comprehensive type system for intents, transactions, and wallet operations
- Intent parser with NLP entity extraction
- Transaction builder with compute budget optimization
- Risk assessment engine for swap and transfer operations
- Jupiter V6 aggregator integration (simulated)
- Jito MEV protection integration (simulated)
- Validation, formatting, and logging utilities
- Main Neyrs client with unified API
- Comprehensive test suite for parser
- Basic usage examples
- Project documentation (CONTRIBUTING.md, SECURITY.md)

### Features
- Natural language intent parsing
- Support for SWAP, SEND, STAKE, UNSTAKE, BALANCE, PRICE, and BUY_PRODUCT actions
- Entity extraction for tokens, amounts, and addresses
- Transaction building with priority fee calculation
- Risk assessment with multiple risk flags
- Structured logging with configurable levels
- Input validation and sanitization
- Address and amount formatting utilities

### Technical
- TypeScript 5.3+ with strict mode
- Vitest for testing
- ESLint and Prettier for code quality
- Solana Web3.js integration
- Axios for HTTP requests
- Zod for runtime validation

[Unreleased]: https://github.com/neyrs/neyrs-core/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/neyrs/neyrs-core/releases/tag/v0.1.0
