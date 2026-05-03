FROM node:22.12-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22.12-alpine

WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist ./dist
COPY scripts/writeRuntimeConfig.mjs ./scripts/writeRuntimeConfig.mjs

EXPOSE 3000

CMD ["sh", "-c", "node scripts/writeRuntimeConfig.mjs dist/runtime-config.js && serve -s dist -l ${PORT:-3000}"]
