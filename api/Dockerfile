# syntax=docker/dockerfile:1
# check=error=true
FROM node:24-trixie-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS build
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS prod-deps
RUN npm ci --omit=dev

# Auxiliary stage
FROM base AS dev
RUN npm ci
COPY . .
CMD [ "npx", "tsx", "watch", "src/server.ts" ]

# Auxiliary stage
FROM build AS test
RUN npm test

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER 1000:1000
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD [ "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" ]
LABEL org.opencontainers.image.source="https://github.com/stefbisti/linkbox"
CMD ["node", "dist/server.js"]

