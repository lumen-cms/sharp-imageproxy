FROM mhart/alpine-node:8
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
RUN apk add vips-dev fftw-dev --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/
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
