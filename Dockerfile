ARG BASE_IMAGE="node:lts"
FROM ${BASE_IMAGE} as build
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

FROM node:lts

WORKDIR /app/api

COPY api/package*.json ./

RUN npm install

COPY api/. .

COPY --from=build /app/client/dist ../client/dist

ENV COMMIT_SHA=${COMMIT_SHA} \
COMMIT_BRANCH=${COMMIT_BRANCH} \
COMMIT_TAG=${COMMIT_TAG} \
COMMIT_DESCRIBE=${COMMIT_DESCRIBE}

EXPOSE 8086

CMD ["node", "index.js"]