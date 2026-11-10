# متجر قافلة — صورة تشغيل للإنتاج
# البناء:  docker build -t qafila .
# التشغيل: docker run -p 3000:3000 -e DATABASE_URL=postgresql://... qafila

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder so modules load during the build. No query runs at build time
# because every page is rendered per request; the real URL is set at runtime.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
# The app creates its tables and sample catalogue on the first request.
CMD ["npm", "run", "start"]
