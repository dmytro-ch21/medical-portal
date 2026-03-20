FROM node:22-alpine

# Build tools needed for better-sqlite3 (native module)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/index.js"]
