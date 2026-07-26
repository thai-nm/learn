FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace=backend
COPY backend backend
RUN npm run build --workspace=backend

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace=backend --omit=dev
COPY --from=build /app/backend/dist backend/dist
EXPOSE 3000
# SQLite file lives here by default (DATABASE_PATH=./data/learn.db,
# resolved against WORKDIR) — mount a persistent volume at this path in
# prod so data survives redeploys.
VOLUME /app/data
CMD ["node", "backend/dist/index.js"]
