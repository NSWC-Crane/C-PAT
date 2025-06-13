ARG BASE_IMAGE="node:lts-alpine"

FROM ${BASE_IMAGE} AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --force
COPY client/. .
RUN npm run build -- --base-href=/

FROM ${BASE_IMAGE}
WORKDIR /home/node
RUN chown -R node:node /home/node
USER node
WORKDIR /home/node/app/api

COPY --chown=node:node api/package*.json ./
RUN npm ci

COPY --chown=node:node api/. .
COPY --chown=node:node --from=build /app/client/dist/browser ../client/dist/browser

RUN mkdir docs
COPY --chown=node:node ./docs/_build/html ../docs/_build/html

COPY --chown=node:node docker-entrypoint.sh /home/node/
RUN chmod +x /home/node/docker-entrypoint.sh

USER root
RUN \
    df -P | awk '{if (NR!=1) print $6}' | \
    xargs -I '{}' find '{}' -xdev -type d -perm -0002 2>/dev/null | \
    xargs chmod a+t 2>/dev/null || true
USER node

EXPOSE 8086
ENTRYPOINT ["/home/node/docker-entrypoint.sh"]
CMD ["node", "index.js"]