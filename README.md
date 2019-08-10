# serverless-cloudfront-invalidation-codebuild

Serverless lambda function for AWS to invalidate AWS CloudFront on AWS CodeBuild success.

SECURITY NOTE: DO NOT PUBLISH IMAGE TO DOCKER IMAGE REPOSITORY. The security aspect of this image has not been thought through thoroughly enough.

## Description

This function listens on and react to ONLY the event changed published by AWS CodeBuild via AWS CloudWatch. It does nothing to the phase change event. Event json structures are found [here](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-build-notifications.html#sample-build-notifications-ref).

## Motivation

This project is derived from the need to automate the invalidation of AWS CloudFront for my `gatsbyjs` application. I am using AWS CloudFront in front of an AWS S3 bucket that is hosting my `gatsbyjs` app to leverage on the caching and the FREE SSL.

![For FREEEEE](assets/for-free.jpg "gif from gifer.com")

Every time a new artifact is built by CodeBuild and uploaded to S3, I want to invalidate the CloudFront cache.

## Alternative Considerations

I have checked out AWS CodePipeline and AWS CodeDeploy but both services do not fit my need. They involve a much proper architecture setup involving servers and databases while mine is just a static site.

It might be easier to write a script locally to build the production gastbyjs app locally and upload to S3 from local machine. However, quoting my [friend](https://github.com/hairizuanbinnoorazman) "anything that touches remote srcs from local development process is a red flag; a smelll", I will attempt to move away from deploying the local machine.

## Files

`handler.js` contains the main invalidation code.

`stateChangeEvent.json` contains the [sample CodeBuild state change event from published by CloudWatch](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-build-notifications.html#sample-build-notifications-ref).

`Dockerfile` pulls the [`serverless-docker` image](https://hub.docker.com/r/amaysim/serverless) which setup a containerized environment for the serverless framework. [`Multi-stage build`](https://docs.docker.com/develop/develop-images/multistage-build/) will be used for development and deployment.

`sampleenv.yml` is a sample of the `env` variables required to be added to the `env.yml`.

## Usage

This service is built for robustness. The service should be able to be used for multiple gastbyjs apps based on different variables set in the `env.yml` file. Refer to [TODO section on how this might improve in the future](#TODO).

### Prerequisite

This service is built using docker image, so no need to install `serverless cli`.

The deployment process uses AWS Access Key ID and Secret Access Key. This will assume you have created the IAM with the relevant permissions to invalidate AWS Cloudfront distribution. Not the best methodology. Refer to [TODO section on how this might improve in the future](#TODO).

### env.yml

The `env.yml` file is ignored under `.gitignore`. It should be created by the user, and the relevant variables that are used can be referred in `sampleenv.yml` file.

#### AWS Region

The region is set to `us-east-1`, which is N. Virginia. It is hardcoded as that because this project assumes CloudFront is used with SSL from ACM. And it seems [only this region will allow HTTPS content to be served via CloudFront and ACM](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-aws-region).

### Development

You will need to build the image first.
Remember to do this step everytime you make changes to your code.
Run command to build the image
```
## NOTE: change the name `scic-cf-invalidation-dev` according to your liking
docker build --target dev -t scic-cf-invalidation-dev:latest .
```

Then run these command to invoke the invalidation script.
```
# replace `scic-cf-invalidation-dev` according to whatever name you gave to the image

docker run --rm scic-cf-invalidation-dev:latest stateChangeEvent.json
```

### Deployment

You will need to build the image first.
Remember to do this step everytime you make changes to your code.

Run command to build the image
```
## NOTE: change the name `scic-cf-invalidation-deploy` according to your liking
docker build --target deploy -t scic-cf-invalidation-deploy:latest .
```

Run the command to deploy to your cloud:

NOTE: This image will mount your aws credentials folder into the docker image only at run-time. This assume you have a role that can do the deployment of serverless function.

```
# `ro` means read-only
docker run --rm -v $HOME/.aws:/root/.aws:ro scic-cf-invalidation-deploy:latest <AWS_NAMED_PROFILE>
```

### Removal

You will need to build the image first.
Remember to do this step everytime you make changes to your code.

Run command to build the image
```
## NOTE: change the name `scic-cf-invalidation-remove` according to your liking
docker build --target remove -t scic-cf-invalidation-remove:latest .
```

Run the command to remove to your cloud:

NOTE: This image will mount your aws credentials folder into the docker image only at run-time. This assume you have a role that can do the removal of serverless function.

```
# `ro` means read-only
docker run --rm -v $HOME/.aws:/root/.aws:ro scic-cf-invalidation-remove:latest <AWS_NAMED_PROFILE>
```

## TODO

* Make this a docker app itself and publish on docker hub; environment variables will be passed when running the docker image. Does this make sense? NEED TO REMOVE copy of env.yml file.
* Possible to move away from using AWS keys to make the deployment from local machine? Maybe setup transient bastion server with authorized service role to make the deployment within cloud? Does serverless framework support this?
* Custom override default IAM service created by serverless framework for the lambda functions