FROM node:22.13-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts
COPY live ./live
COPY scripts ./scripts
COPY db ./db
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node","live/server.mjs"]
