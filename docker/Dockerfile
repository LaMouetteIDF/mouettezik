FROM node:16-alpine AS builder
RUN apk add --update --no-cache alpine-sdk autoconf automake  python3 make ffmpeg libtool
RUN ln -sf python3 /usr/bin/python
RUN yarn global add node-gyp

WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./

ENV YOUTUBE_DL_SKIP_DOWNLOAD=true
RUN yarn
COPY . .
RUN yarn build

#RUN rm -rf ./node_modules
#RUN yarn install -prod

RUN wget https://yt-dl.org/downloads/latest/youtube-dl -O ./youtube-dl



FROM node:16-alpine

RUN apk add --update --no-cache ffmpeg python3
RUN ln -sf python3 /usr/bin/python

WORKDIR /app


COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/youtube-dl /usr/local/bin/youtube-dl

RUN chmod a+rx /usr/local/bin/youtube-dl

VOLUME /data

EXPOSE 3000

CMD ["yarn", "run", "start:prod"]
