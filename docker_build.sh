#!/bin/bash

docker build . -t blockbrain:latest
docker stop BlockBrain
docker rm BlockBrain
docker run -d --name BlockBrain -p 4443:443 \
  -v /mnt/FullNAS/Users/Alfonso/Development/BlockBrain:/usr/src/app \
  blockbrain:latest
