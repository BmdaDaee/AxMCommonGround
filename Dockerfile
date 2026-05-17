FROM node:22-alpine

WORKDIR /app

# Copy just what we need
COPY package.json pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/

# Install deps
RUN npm install

# Copy server.js from root
COPY server.js .

EXPOSE 3001

CMD ["node", "server.js"]
