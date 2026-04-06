# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. Please follow responsible disclosure practices.

### How to Report

DO NOT create public GitHub issues for security vulnerabilities.

Instead, report via:

1. Email: security@neyrs.app
2. GitHub Security Advisory: Use private vulnerability reporting

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)
- Your contact information

### Response Timeline

- Initial Response: Within 48 hours
- Status Update: Within 7 days
- Fix Timeline: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: 90+ days

### Disclosure Policy

- We will acknowledge receipt of your report
- We will provide regular updates on progress
- We will notify you when the issue is fixed
- We will credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices

### For Users

```typescript
// Always validate wallet addresses
import { Validator } from '@neyrs/core';

Validator.validateSolanaAddress(address);

// Use environment variables for sensitive data
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY not configured');
}

// Enable MEV protection for production
const client = new NeyrsClient({
  rpcEndpoint: process.env.RPC_ENDPOINT,
  mevProtection: true,
});

// Always assess risk before transactions
const risk = await client.assessRisk(intent);
if (risk.riskLevel === 'CRITICAL') {
  console.warn('High risk detected:', risk.flags);
  return;
}
```

### For Contributors

- Never commit secrets or credentials
- Use `.gitignore` for sensitive files
- Review dependencies for vulnerabilities
- Follow secure coding practices
- Enable 2FA on GitHub account

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Security Features

### Non-Custodial Design

- Client never accesses private keys
- All transactions require user signature
- No sensitive data stored or transmitted

### Risk Assessment

- Token verification checks
- Liquidity analysis
- Honey-pot detection
- Suspicious activity monitoring

### MEV Protection

- Jito bundle support
- Front-running prevention
- Sandwich attack mitigation

## Known Security Considerations

### Transaction Signing

- Always verify transaction details before signing
- Use hardware wallets for large amounts
- Test with small amounts first

### API Keys

- Store API keys securely
- Rotate keys regularly
- Use environment variables
- Never commit keys to version control

### Rate Limiting

- Implement rate limiting in production
- Monitor for unusual activity
- Set appropriate timeouts

## Contact

For security concerns: security@neyrs.app

For general questions: support@neyrs.app

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security)
