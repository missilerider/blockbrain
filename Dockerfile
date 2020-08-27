FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json postinstall.sh /usr/src/app/

RUN apk update && apk upgrade && \
        apk add git && \
        npm install && \
        pwd && ls -la && \
        git clone https://github.com/google/blockly.git blockly && \
        git clone https://github.com/google/closure-library.git closure-library && \
        apk del git && \
        mkdir -p /usr/src/app/config && \
        mkdir -p /usr/src/app/vault && \
        chown node:node -R /usr/src/app/config && \
        chown node:node -R /usr/src/app/vault

COPY . /usr/src/app/

ENV VAULT_PATH /home/node/vault           
ENV CONFIG_PATH /home/node/config

EXPOSE 8000
EXPOSE 443

USER node

CMD [ "npm", "start" ]
