FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/index.js"]
