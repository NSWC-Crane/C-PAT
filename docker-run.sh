#!/bin/bash
docker container rm c-pat-auth --force
docker run --name c-pat-auth -p ${2:-8080}:8080 -p 8443:8443 -d c-pat-auth:${1:-dev} start-dev --import-realm
docker logs -f c-pat-auth