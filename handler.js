const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

module.exports.invalidateCloudfront = async (event) => {
  console.log('CodeBuild event:', event);
  console.log('CloudFront distribution ID:', process.env.CF_DISTRIBUTION_ID);

  // ignore phase change events
  try {
    if (event['detail-type'] === 'CodeBuild Build Phase Change') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Ignore 'Build Phase Change' from ${event.detail['completed-phase']} to ${event.detail['completed-phase-status']}`,
        }),
      };
    }
  } catch (error) {
    // handle unexpected errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }

  // handle state change events
  try {
    if (event['detail-type'] === 'CodeBuild Build State Change') {
      const buildStatus = event.detail['build-status'];

      console.log(`buildStatus: ${buildStatus}`);
      if (buildStatus !== 'SUCCEEDED') {
        // ignore non SUCCEEDED build status
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `Build status is ${buildStatus}.`,
          }),
        };
      }

      const cloudfront = new AWS.CloudFront({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      });
      const params = {
        DistributionId: process.env.CF_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: uuidv4(),
          Paths: {
            Quantity: 1,
            Items: ['/*'],
          },
        },
      };

      const response = await cloudfront.createInvalidation(params).promise();

      console.log(response);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully invalidate cloudfront distribution: ${process.env.CF_DISTRIBUTION_ID}.`,
          data: JSON.stringify({ response }),
        }),
      };
    }
  } catch (error) {
    // handle unexpected errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Unhandled event. Refer to event object at start of function log.',
    }),
  };
};
