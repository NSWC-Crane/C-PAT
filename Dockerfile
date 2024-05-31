FROM quay.io/keycloak/keycloak:24.0.4

COPY import_realm.json /opt/keycloak/data/import/import_realm.json

ENV KEYCLOAK_ADMIN admin
ENV KEYCLOAK_ADMIN_PASSWORD Pa55w0rd

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]