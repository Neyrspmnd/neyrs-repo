# Contributing to Neyrs

Thank you for considering contributing to Neyrs. This document outlines the process and guidelines.

## Code of Conduct

This project adheres to professional standards. By participating, you agree to maintain respectful and constructive communication.

## Development Process

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/neyrs-core.git
cd neyrs-core
git remote add upstream https://github.com/neyrs/neyrs-core.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

### 3. Development Setup

```bash
npm install
npm run dev
```

### 4. Make Changes

- Write clean, maintainable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### 5. Commit Guidelines

Follow conventional commits specification:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks
- `perf`: Performance improvements

Examples:

```bash
git commit -m "feat(parser): add support for staking intents"
git commit -m "fix(client): resolve connection timeout issue"
git commit -m "docs(readme): update installation instructions"
```

### 6. Testing

```bash
npm test                    # Run all tests
npm run test:coverage      # With coverage
npm run lint               # Check code style
npm run type-check         # TypeScript validation
```

All tests must pass before submitting a PR.

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Title Format

Follow conventional commits format:

```
type(scope): description
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
```

## Code Style Guidelines

### TypeScript

```typescript
// Use explicit types
function processData(input: string): ProcessedData {
  // Implementation
}

// Use const for immutable values
const MAX_RETRIES = 3;

// Use descriptive names
const userWalletAddress = getAddress();

// Avoid magic numbers
const TIMEOUT_MS = 5000;
setTimeout(callback, TIMEOUT_MS);
```

### Documentation

```typescript
/**
 * Processes user intent and returns parsed result
 * 
 * @param query - Natural language query
 * @returns Parsed intent with confidence score
 * @throws {ParseError} If query cannot be parsed
 * 
 * @example
 * ```typescript
 * const intent = await parser.parse('swap 5 SOL for USDC');
 * ```
 */
async function parse(query: string): Promise<ParsedIntent> {
  // Implementation
}
```

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('IntentParser', () => {
  let parser: IntentParser;

  beforeEach(() => {
    parser = new IntentParser();
  });

  it('should parse swap intent correctly', async () => {
    const result = await parser.parse('swap 5 SOL for USDC');
    expect(result.action).toBe('SWAP');
    expect(result.parameters.amount).toBe(5);
  });
});
```

## Review Process

1. Automated checks must pass (CI/CD)
2. Code review by maintainers
3. Address feedback
4. Final approval and merge

## Questions?

- Check existing issues and discussions
- Create a new issue for bugs
- Start a discussion for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
