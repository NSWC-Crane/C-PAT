#!/bin/bash

docker exec -it ${1:-c-pat-auth_dev} /opt/keycloak/bin/kc.sh export --dir /tmp --realm RMFTools --users realm_file

docker cp ${1:-c-pat-auth_dev}:/tmp/RMFTools-realm.json .

