FROM node:latest
# FROM mongo:latest
FROM alpine:latest
# FROM ubuntu:latest
# WORKDIR /app
RUN apk add --update npm nodejs
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/main' >> /etc/apk/repositories
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories
RUN apk update
# RUN apk add mongodb
# RUN apk add mongodb-tools
# RUN mkdir -p /data/db/
# RUN which mongod
# RUN which mongodb
# RUN /bin/mongod
# RUN rc-update add mongodb default
# RUN rc-service mongodb start

LABEL version="1.0"
LABEL description="A simple encrypted chat room"
WORKDIR /app
COPY ./ /app
RUN npm install

EXPOSE 3333/tcp



CMD ["nohup","node","index.js"]