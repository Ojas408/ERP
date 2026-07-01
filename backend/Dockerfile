FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client and build typescript
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
