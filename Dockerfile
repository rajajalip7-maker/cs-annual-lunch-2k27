FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl fontconfig unzip wget
RUN fc-cache -f

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY scripts ./scripts

ENV DATABASE_URL="file:./prisma/prod.db"
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

RUN mkdir -p uploads/proofs prisma

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npx", "tsx", "scripts/docker-start.ts"]
