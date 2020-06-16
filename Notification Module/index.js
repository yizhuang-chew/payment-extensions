/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

const _sdkClient = require('@commercetools/sdk-client')
const _sdkMiddlewareAuth = require('@commercetools/sdk-middleware-auth')
const _sdkMiddleWareHttp = require('@commercetools/sdk-middleware-http')
const _apiRequestBuilder = require('@commercetools/api-request-builder')
const fetch = require('node-fetch');

const config = {
  authUrl: process.env.AUTH_API || 'https://auth.australia-southeast1.gcp.commercetools.com',
  apiUrl: process.env.HTTP_API || 'https://api.australia-southeast1.gcp.commercetools.com',
  projectKey: process.env.PROJECT_KEY,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
}

function createClient() {
  const client = _sdkClient.createClient({
    // The order of the middlewares is important !!!
    middlewares: [
      _sdkMiddlewareAuth.createAuthMiddlewareForClientCredentialsFlow({
        host: config.authUrl,
        projectKey: config.projectKey,
        credentials: {
          clientId: config.clientId,
          clientSecret: config.clientSecret
        },
        fetch
      }),
      _sdkMiddleWareHttp.createHttpMiddleware({ host: config.apiUrl, fetch })
    ]
  });
  return client;
}

exports.entryPoint = (req, res) => {
  try {
    console.log('Function executing');
    let object = req.body.data.object;
    let metadata = object.metadata;
    let paymentId = metadata.commercetools_payment_id;
    let paymentVersion = Number(metadata.commercetools_payment_version);
    let amount = object.amount;
    let currency = object.currency.toUpperCase();;

    let body = {
      "version": paymentVersion,
      "actions": [
        {
          "action": "addTransaction",
          "state": "Success",
          "transaction": {
            "type": "Charge",
            "amount": {
              "centAmount": amount,
              "currencyCode": currency
            }
          }
        },
        {
          "action": "setStatusInterfaceCode",
          "interfaceCode": "Done"          
        }
      ]
    };

    //let paymentType = object.currency;
    console.log('payment body', body);
    console.log('payment body actions', body.actions);
    console.log('payment body actions amount', body.actions[0].transaction.amount);

    if (!config.projectKey || !config.clientId || !config.clientSecret) {
      console.log("Missing configuration");
      res.status(400).send('Missing Config');
    }

    const client = createClient();
    const requestBuilder = _apiRequestBuilder.createRequestBuilder({ projectKey: config.projectKey })
    const paymentService = requestBuilder.payments;
    const addTransaction = {
      uri: paymentService
        .byId(paymentId)
        .build(),
      method: 'POST',
      body: body,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    client
      .execute(addTransaction)
      .then(response => {

        console.log('payment updated', response)
        res.status(200).end()

      })
      .catch(error => {
        console.log(error)
        console.log('error message' + error.message)
        res.status(400).send('exception' + error)
      })
  } catch (e) {
    console.log(e)
    res.status(400).send('exception' + e)
  }
};
