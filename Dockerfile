FROM mhart/alpine-node:10
RUN apk add --update \
  --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
  vips-dev fftw-dev \
  && rm -rf /var/cache/apk/*
WORKDIR /usr/src
COPY package.json /usr/src/
COPY package-lock.json /usr/src/
RUN apk add --no-cache --virtual .build-deps alpine-sdk python \
 && npm install --production --ignore-scripts \
 && npm rebuild \
 && apk del .build-deps
COPY . .
ENV NODE_ENV="production"
CMD ["node", "./node_modules/.bin/micro"]
