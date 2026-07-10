FROM node:22-alpine AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@11.7.0

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

ARG DATABASE_URL=postgres://user:password@db:5432/db
ARG BETTER_AUTH_SECRET=build-time-secret
ARG BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY . .
RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app ./

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate && node .next/standalone/server.js"]
