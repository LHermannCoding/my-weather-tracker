FROM node:20-slim

WORKDIR /app

COPY apps/worker/package.json apps/worker/package-lock.json* ./
RUN npm install

COPY apps/worker/ ./
RUN npm run build

CMD ["node", "dist/index.js"]
