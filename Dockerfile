FROM node:8.3-alpine

EXPOSE 3000
RUN apk update && apk add --no-cache \
    curl \
    bash \
    && addgroup amorphic \
    && adduser -s /bin/bash -D -G amorphic amorphic

WORKDIR /app

COPY ./wait-for-it.sh .

# Default to production npm install unless otherwise specified
ARG NODE_ENV=production

COPY ./package.json .
RUN yarn install --production=true

COPY ./ ./

RUN yarn install --production=false \
    && npm run compile:ts \
    && npm run build:app \
    && yarn install --production --ignore-scripts --prefer-offline \
    #amorphic creates this and it should be addressed
    && mkdir download \
    && chown amorphic:amorphic download

USER amorphic
