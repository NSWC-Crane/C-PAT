ARG BASE_IMAGE="node:lts-alpine"

FROM ${BASE_IMAGE} AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --force
COPY client/. .
RUN npm run build

FROM ${BASE_IMAGE}
WORKDIR /home/node
RUN chown -R node:node /home/node
USER node
WORKDIR /home/node/app/api

COPY --chown=node:node api/package*.json ./
RUN npm ci

COPY --chown=node:node api/. .

COPY --chown=node:node --from=build /app/client/dist ../client/dist

USER root
RUN \
    df -P | awk '{if (NR!=1) print $6}' | \
    xargs -I '{}' find '{}' -xdev -type d -perm -0002 2>/dev/null | \
    xargs chmod a+t 2>/dev/null || true
USER node

EXPOSE 8086
CMD ["node", "index.js"]