FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/
COPY packages/mobile/package.json ./packages/mobile/

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build server
RUN pnpm --filter @axmcommonground/server build

# Start server
CMD ["node", "packages/server/dist/src/index.js"]
