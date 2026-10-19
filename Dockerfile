FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_EXERCISE_API_SECRET
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_EXERCISE_API_SECRET=$NEXT_PUBLIC_EXERCISE_API_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/import-exercise-state.mjs ./scripts/import-exercise-state.mjs
EXPOSE 3000
CMD ["node", "server.js"]
