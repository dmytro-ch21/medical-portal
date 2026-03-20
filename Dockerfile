FROM node:22-slim

# Build tools needed for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/index.js"]
