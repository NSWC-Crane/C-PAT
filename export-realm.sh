#!/bin/bash

docker exec -it ${1:-c-pat-auth} /opt/keycloak/bin/kc.sh export --dir /tmp --realm RMFTools --users realm_file

docker cp ${1:-c-pat-auth}:/tmp/RMFTools-realm.json .

