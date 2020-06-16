/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

exports.entryPoint = (req, res) => {
  try {
    console.log('Function executing');
    let message = req.body;
    console.log('message', message);

    if (message.resource.obj.paymentMethodInfo.method == 'stripe') {
      if (!message.resource.obj.paymentMethodInfo.paymentInterface || 0 === message.resource.obj.paymentMethodInfo.paymentInterface.length) {
        const stripe = require('stripe')('sk_test_fLYhb8koQOlIPyLueet5A2Ak00Yf2O7j6c');

        const paymentIntent = stripe.paymentIntents.create({
          amount: message.resource.obj.amountPlanned.centAmount,
          currency: message.resource.obj.amountPlanned.currencyCode,
          // Verify your integration in this guide by including this parameter
          metadata: {
            integration_check: 'accept_a_payment',
            commercetools_payment_id: message.resource.obj.id,
            commercetools_payment_version: message.resource.obj.version + 1
          }
        }).then(function (responseJson) {
          var clientSecret = responseJson.client_secret;
          console.log('client secret', clientSecret);
          const paymentId = message.resource.obj.id;
          const paymentVersion = message.resource.obj.version;
          const updatePayment = {
            "actions": [{
              "action": "setMethodInfoInterface",
              "interface": clientSecret
            }]
          }

          res.status(200).send(updatePayment);

          // Call stripe.confirmCardPayment() with the client secret.
        });

        console.log('paymentIntent', paymentIntent)
      }
      else if(message.resource.obj.paymentStatus.interfaceCode != "Done"){
        const paymentIntentId = message.resource.obj.paymentMethodInfo.paymentInterface.split('_secret')[0];
        console.log('paymentIntentId', paymentIntentId);
        const stripe = require('stripe')('sk_test_fLYhb8koQOlIPyLueet5A2Ak00Yf2O7j6c');
        const paymentIntent = stripe.paymentIntents.update(
          paymentIntentId
          , {
            amount: message.resource.obj.amountPlanned.centAmount,
            currency: message.resource.obj.amountPlanned.currencyCode,
            // Verify your integration in this guide by including this parameter
            metadata: {
              integration_check: 'accept_a_payment',
              commercetools_payment_id: message.resource.obj.id,
              commercetools_payment_version: message.resource.obj.version
            }
          }).then(function (result) {
            if (result.error) {
              // Show error to your customer (e.g., insufficient funds)
              console.log('error', result.error.message);
              res.status(200).send(result.error.message);
            } else {
               res.status(200).end();
            }
          })

      }
      else{
        res.status(200).end();
      }
    }
    else {
      res.status(200).end();
    }

  } catch (e) {
    console.log('error', e)
  }
};
