FROM node:24-alpine AS base

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

FROM base AS deps

COPY package*.json ./
RUN npm ci

FROM deps AS build

COPY nest-cli.json tsconfig*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run prisma:emit && npm run build

FROM deps AS prod-deps

ENV NODE_ENV=production
RUN npm prune --omit=dev && npm cache clean --force

FROM base AS prod

ARG USER_GID=1001
ARG USER_UID=1001
ARG USER_NAME=paymentd

ENV NODE_ENV=production \
    PORT=3000

RUN addgroup -S -g $USER_GID $USER_NAME \
    && adduser -S -u $USER_UID -G $USER_NAME $USER_NAME

COPY --from=prod-deps --chown=$USER_UID:$USER_GID /app/node_modules ./node_modules
COPY --from=build --chown=$USER_UID:$USER_GID /app/dist ./dist
COPY --from=build --chown=$USER_UID:$USER_GID /app/prisma/generated ./prisma/generated
COPY --chown=$USER_UID:$USER_GID package.json ./package.json

RUN chmod -R go-w /app

USER $USER_NAME

EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM deps AS migration

ENV NODE_ENV=production

COPY prisma.config.ts ./
COPY prisma ./prisma

CMD ["npm", "run", "prisma:migrate"]

FROM deps AS dev

ENV NODE_ENV=development \
    PORT=3000

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
