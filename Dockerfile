FROM node:22-alpine

WORKDIR /app

# Install pnpm v9
RUN npm install -g pnpm@9

# Copy workspace files FIRST (immutable layer)
COPY package.json pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/mobile/package.json ./packages/mobile/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy ALL source (this will always rebuild)
COPY . .

# Build server
RUN pnpm --filter @axmcommonground/server build

EXPOSE 3001

CMD ["node", "packages/server/dist/src/index.js"]

# Invalidation: 1779009849
