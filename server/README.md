# CommonGround Server Workspace

This workspace implements the Phase 2 backend foundation for AxMCommonGround. It provides an Express service, a tRPC API mounted at `/trpc`, a Drizzle ORM schema, a deterministic five-state relational engine, and provider adapters for Claude and Venice AI.

## Commands

```bash
npm install
npm run typecheck
npm run dev
```

The REST health check is available at `GET /health` and returns `{ "status": "ok" }`.
