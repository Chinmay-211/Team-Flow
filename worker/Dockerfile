FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY worker/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci

COPY worker/ .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY worker/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD ["node", "dist/index.js"]
