FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/mobile/package.json ./packages/mobile/

# Install dependencies (allow regeneration of lockfile)
RUN pnpm install --no-frozen-lockfile || npm install

# Copy all source
COPY . .

# Build TypeScript server
RUN pnpm --filter @axmcommonground/server build || echo "TypeScript build attempted"

# Copy server.js entry point
COPY server.js .

EXPOSE 3001

# Start with server.js (which will try to load compiled TS, or fallback)
CMD ["node", "server.js"]
