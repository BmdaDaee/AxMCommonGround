FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy all package.json files (workspaces)
COPY package.json pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/
COPY packages/mobile/package.json ./packages/mobile/

# Install all dependencies (allow regeneration)
RUN pnpm install --no-frozen-lockfile 2>&1

# Copy rest of source
COPY . .

# Build server only
RUN pnpm --filter @axmcommonground/server build 2>&1

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "packages/server/dist/src/index.js"]
