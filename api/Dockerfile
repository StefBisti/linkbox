FROM node:24-trixie-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

USER 1000:1000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" ]

CMD ["node", "dist/server.js"]