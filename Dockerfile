FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

RUN mkdir -p uploads/proofs prisma

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:./prisma/prod.db"

CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm start"]
