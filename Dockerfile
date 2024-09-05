ARG BASE_IMAGE="node:lts-alpine"
FROM ${BASE_IMAGE} AS build
ARG COMMIT_BRANCH="unspecified"
ARG COMMIT_SHA="unspecified"
ARG COMMIT_TAG="unspecified"
ARG COMMIT_DESCRIBE="unspecified"
LABEL commit-branch=${COMMIT_BRANCH}
LABEL commit-sha=${COMMIT_SHA}
LABEL commit-tag=${COMMIT_TAG}
LABEL commit-describe=${COMMIT_DESCRIBE}
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
ENV COMMIT_SHA=${COMMIT_SHA} \
    COMMIT_BRANCH=${COMMIT_BRANCH} \
    COMMIT_TAG=${COMMIT_TAG} \
    COMMIT_DESCRIBE=${COMMIT_DESCRIBE}
USER root
RUN \
    df -P | awk '{if (NR!=1) print $6}' | \
    xargs -I '{}' find '{}' -xdev -type d -perm -0002 2>/dev/null | \
    xargs chmod a+t 2>/dev/null || true
USER node
EXPOSE 8086
CMD ["node", "index.js"]