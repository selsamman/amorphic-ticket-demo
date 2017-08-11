FROM node:8.3-alpine

EXPOSE 3000

RUN addgroup amorphic \
    && adduser -s /bin/bash -D -G amorphic amorphic

WORKDIR /app

# Default to production npm install unless otherwise specified
ARG NODE_ENV=production
ENV NODE_PATH=/app/node_modules/

COPY ./package.json ./
RUN npm install --no-progress

COPY ./ ./

# the project should have a tsconfig.json in the root... right now userman is a ts dep
RUN NODE_ENV=development npm install --no-progress \
    && ./node_modules/.bin/tsc -p ./node_modules/amorphic-userman \
    && npm prune --production

USER amorphic
