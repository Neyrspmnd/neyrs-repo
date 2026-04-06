# Deployment Guide

## Overview

This guide covers deploying Neyrs in production environments.

## Prerequisites

- Node.js 18+ installed
- Rust 1.70+ installed
- npm or yarn package manager
- Solana RPC endpoint access
- (Optional) Redis for distributed caching

## Build for Production

### 1. Install Dependencies

```bash
npm install --production
```

### 2. Build Rust Parser

```bash
cd core-parser
cargo build --release
cd ..
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Run Tests

```bash
npm test
```

## Environment Configuration

### Required Environment Variables

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
NODE_ENV=production
```

### Optional Environment Variables

```bash
# AI Configuration
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Commerce Integration
AMAZON_API_KEY=your_key_here

# Redis Cache
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

## Deployment Options

### Option 1: Docker

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install Rust
RUN apk add --no-cache curl build-base
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY core-parser ./core-parser

# Build Rust parser
WORKDIR /app/core-parser
RUN cargo build --release

# Build TypeScript
WORKDIR /app
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/core-parser/target/release ./core-parser/target/release
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t neyrs-core .
docker run -p 3000:3000 --env-file .env neyrs-core
```

### Option 2: PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name neyrs-core

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

PM2 ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'neyrs-core',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

### Option 3: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neyrs-core
spec:
  replicas: 3
  selector:
    matchLabels:
      app: neyrs-core
  template:
    metadata:
      labels:
        app: neyrs-core
    spec:
      containers:
      - name: neyrs-core
        image: neyrs-core:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: RPC_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: neyrs-secrets
              key: rpc-endpoint
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: neyrs-core-service
spec:
  selector:
    app: neyrs-core
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

## Performance Tuning

### Node.js Configuration

```bash
# Increase memory limit
node --max-old-space-size=4096 dist/index.js

# Enable CPU profiling
node --cpu-prof dist/index.js

# Optimize garbage collection
node --expose-gc --optimize-for-size dist/index.js
```

### Connection Pooling

```typescript
const connection = new Connection(rpcEndpoint, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
  httpHeaders: {
    'Connection': 'keep-alive',
  },
});
```

## Monitoring

### Health Checks

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    await connection.getLatestBlockhash();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### Logging

```typescript
import { Logger, LogLevel } from '@neyrs/core';

const logger = new Logger(LogLevel.INFO, {
  service: 'neyrs-core',
  environment: process.env.NODE_ENV,
});
```

### Metrics

```typescript
import { globalMetrics } from '@neyrs/core';

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = globalMetrics.getAllMetrics();
  res.json(metrics);
});
```

## Security

### API Key Management

```bash
# Use environment variables
export API_KEY=$(openssl rand -hex 32)

# Or use secrets management
kubectl create secret generic neyrs-secrets \
  --from-literal=api-key=$API_KEY
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));
```

## Scaling

### Horizontal Scaling

```bash
# PM2 cluster mode
pm2 start dist/index.js -i max

# Kubernetes replicas
kubectl scale deployment neyrs-core --replicas=5
```

### Load Balancing

```nginx
# nginx.conf
upstream neyrs_backend {
    least_conn;
    server 10.0.1.1:3000;
    server 10.0.1.2:3000;
    server 10.0.1.3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://neyrs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup and Recovery

### Database Backup

```bash
# Backup Redis
redis-cli --rdb /backup/dump.rdb

# Restore Redis
redis-cli --rdb /backup/dump.rdb
```

### Configuration Backup

```bash
# Backup environment
cp .env .env.backup

# Backup PM2 configuration
pm2 save
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Increase Node.js memory limit
   - Check for memory leaks
   - Optimize caching strategy

2. **Slow Response Times**
   - Check RPC endpoint latency
   - Enable caching
   - Optimize database queries

3. **Connection Timeouts**
   - Increase timeout values
   - Use connection pooling
   - Check network connectivity

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug node dist/index.js

# Enable Node.js debugging
node --inspect dist/index.js
```

## Maintenance

### Updates

```bash
# Update dependencies
npm update

# Rebuild Rust parser
cd core-parser
cargo update
cargo build --release
cd ..

# Rebuild TypeScript
npm run build

# Restart application
pm2 restart neyrs-core
```

### Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs neyrs-core

# Check status
pm2 status
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Rust parser built in release mode
- [ ] TypeScript compiled
- [ ] Tests passing
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Health checks implemented
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Security headers set
- [ ] SSL/TLS enabled
- [ ] Backup strategy defined
- [ ] Scaling strategy defined
- [ ] Documentation updated
