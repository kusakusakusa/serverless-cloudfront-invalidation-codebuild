FROM amaysim/serverless:1.49.0 AS base
WORKDIR /app
COPY . .

FROM base AS invoke
CMD [ "sls", "invoke", "local", "-f", "invalidateCloudfront", "-p", "stateChangeEvent.json" ]