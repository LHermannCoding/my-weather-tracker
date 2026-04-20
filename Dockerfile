FROM node:20-slim

WORKDIR /app

COPY apps/worker/package.json ./
RUN npm install

COPY apps/worker/src ./src
COPY apps/worker/tsconfig.json ./

CMD ["npx", "tsx", "src/index.ts"]
