FROM node:24-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY mobile/package.json mobile/package.json
RUN pnpm install --frozen-lockfile
COPY backend/ backend/
COPY docs/contracts/accounts.openapi.yaml docs/contracts/accounts.openapi.yaml
RUN pnpm --filter studentmart-backend build \
    && pnpm --filter studentmart-backend deploy --prod --legacy /runtime

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /runtime/ ./
COPY --from=build --chown=node:node /workspace/backend/dist/ ./dist/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/bootstrap/server.js"]
