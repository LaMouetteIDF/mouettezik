FROM node:16-alpine AS builder
RUN apk add  --no-cache alpine-sdk autoconf automake  python3 make
RUN apk add  --no-cache ffmpeg libtool
RUN yarn global add node-gyp

WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM node:16-alpine

RUN apk add  --no-cache ffmpeg

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

VOLUME /data

EXPOSE 3000

CMD ["yarn", "run", "start:prod"]
