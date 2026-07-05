FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

RUN chmod +x docker-entrypoint.sh
RUN mkdir -p uploads

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=40s \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
