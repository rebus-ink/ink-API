ARG NODE_VERSION=16.15.1
ARG BUILDER_OS_VERSION=bullseye
ARG RUNNER_OS_VERSION=slim

ARG BUILDER_IMAGE="node:${NODE_VERSION}-${BUILDER_OS_VERSION}"
ARG RUNNER_IMAGE="node:${NODE_VERSION}-${RUNNER_OS_VERSION}"

# DEPS: Build production deps only

FROM ${BUILDER_IMAGE} AS deps

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install -g npm@8.11.0
RUN npm ci --prod

# RUNNER: Only contains build/runtime artifacts

FROM ${RUNNER_IMAGE}

WORKDIR /app

COPY --from=deps /app .
COPY migrations migrations
COPY models models
COPY routes routes
COPY utils utils
COPY *.js ./

EXPOSE 8080
CMD ["node", "index.js"]
