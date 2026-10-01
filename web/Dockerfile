# syntax=docker/dockerfile:1
# check=error=true

ARG BASE_IMAGE=node:24-trixie-slim

FROM ${BASE_IMAGE} AS base
USER 1000
WORKDIR /app
COPY --chown=1000:1000 package.json package-lock.json ./

FROM base AS dev
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci
COPY --chown=1000:1000 . .
EXPOSE 5173
CMD ["npx", "vite", "--host"]

FROM --platform=$BUILDPLATFORM ${BASE_IMAGE} AS build
USER 1000
WORKDIR /app
COPY --chown=1000:1000 package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci
COPY --chown=1000:1000 . .
RUN npm run build

FROM nginxinc/nginx-unprivileged AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html
EXPOSE 8080
