FROM node:22-alpine

WORKDIR /app

# Install pnpm v9 (compatible with Node 22)
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/mobile/package.json ./packages/mobile/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Copy rest of source
COPY . .

# Build server only
RUN pnpm --filter @axmcommonground/server build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "packages/server/dist/src/index.js"]
