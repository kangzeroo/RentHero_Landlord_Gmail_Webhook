
# Landlord Gmail Webhook
This is a Google Cloud Function that is hosted on Google App Engine. Whenever a new email is received by a RentHero landlord, this function is called at index.js.

## Prod vs Dev
In dev, we run `npm run dev` and use Postman to mimic POST requests to `https://localhost:7888/mock_gmail_webhook` which triggers the cloud function. Be sure to uncomment the Promise based code in index.js `incoming_email()` as it is used in dev only<br/>
<br/>
In prod, the cloud function is triggered automatically. There is no `npm run dev` hosting. Be sure to comment out the Promise based code in index.js `incoming_email()` as that is used in dev only
