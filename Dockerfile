# A single container with a persistent local volume. Never horizontally replicate SQLite.
FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node public ./public
COPY --chown=node:node server ./server
COPY --chown=node:node docs/legal ./docs/legal
COPY --chown=node:node tools ./tools
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV PORT=4173 DATA_DIR=/app/data
EXPOSE 4173
VOLUME ["/app/data"]
CMD ["node", "server/index.mjs"]
