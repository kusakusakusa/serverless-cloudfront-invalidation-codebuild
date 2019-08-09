FROM amaysim/serverless:1.49.0 AS base
WORKDIR /app

# copy over `env.yml` file as well
COPY . .
RUN yarn install && yarn cache clean

FROM base AS dev
ENTRYPOINT [ "sls", "invoke", "local", "-f", "invalidateCloudfront", "-p" ]

FROM base AS deploy
ENTRYPOINT [ "sls", "deploy", "--stage", "production", "--aws-profile" ]

FROM base AS remove
ENTRYPOINT [ "sls", "remove", "--stage", "production", "--aws-profile" ]