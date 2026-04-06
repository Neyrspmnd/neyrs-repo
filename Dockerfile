FROM node:18-alpine AS builder

WORKDIR /app

# Install Rust
RUN apk add --no-cache curl build-base
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vitest.config.ts ./

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
COPY --from=builder /app/core-parser/target/release/libneyrs_parser.so ./core-parser/target/release/ 2>/dev/null || true
COPY --from=builder /app/core-parser/target/release/libneyrs_parser.dylib ./core-parser/target/release/ 2>/dev/null || true
COPY --from=builder /app/core-parser/target/release/neyrs_parser.dll ./core-parser/target/release/ 2>/dev/null || true
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
