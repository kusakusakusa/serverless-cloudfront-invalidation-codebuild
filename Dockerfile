FROM amaysim/serverless:1.49.0 AS base
WORKDIR /app

# copy over `env.yml` file as well
COPY . .
RUN yarn install && yarn cache clean

FROM base AS dev
ENTRYPOINT [ "sls", "invoke", "local", "-f", "invalidateCloudfront", "-p" ]

