FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json postinstall.sh /usr/src/app/

RUN apk update && apk upgrade && \
        apk add git && \
        npm install

RUN pwd && ls -la && \
        git clone https://github.com/google/blockly.git blockly && \
        git clone https://github.com/google/closure-library.git closure-library && \
        apk del git

COPY . /usr/src/app/

EXPOSE 8000
EXPOSE 443

USER node

CMD [ "npm", "start" ]
