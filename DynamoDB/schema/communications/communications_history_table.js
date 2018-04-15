const AWS = require('aws-sdk')
const aws_config = require('../../../credentials/aws_config')
const RENTHERO_COMM_LOGS = require('../dynamodb_tablenames').RENTHERO_COMM_LOGS
AWS.config.update(aws_config)


const rentheroCommLogsTableParams = {
    TableName : RENTHERO_COMM_LOGS,
    KeySchema: [
        // USE CASE: ALLOWS ME TO SEE ALL USER PREFERENCES INTEL IN CHRONOLOGICAL ORDER. EG: USER LOOKS FOR ENSUITE FIRST BEFORE CHANGING THEIR FILTERS TO LOOK FOR LESS ROOMATES NO ENSUITE
        { AttributeName: "CHANNEL_ID", KeyType: "HASH" },  //Partition key
        { AttributeName: "DATETIME", KeyType: "RANGE" },  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "MESSAGE_ID", AttributeType: "S" },
        { AttributeName: "CHANNEL_ID", AttributeType: "S" },
        { AttributeName: "CORPORATION_ID", AttributeType: "S" },
        // { AttributeName: "SENDER_ID", AttributeType: "S" },
        // { AttributeName: "STAFF_ID", AttributeType: "S" },
        // { AttributeName: "MEDIUM", AttributeType: "S" },
        // { AttributeName: "CONTACT_ID", AttributeType: "S" },
        // { AttributeName: "MESSAGE", AttributeType: "S" },
        { AttributeName: "DATETIME", AttributeType: "N" },
        { AttributeName: "CHANNEL_ID_DATETIME", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
    },
    GlobalSecondaryIndexes: [
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_Corporation_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'CORPORATION_ID', KeyType: 'HASH'},
          {AttributeName: 'CHANNEL_ID_DATETIME', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 10, /* required */
          WriteCapacityUnits: 10 /* required */
        }
      },
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_Message_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'MESSAGE_ID', KeyType: 'HASH'},
          {AttributeName: 'DATETIME', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 10, /* required */
          WriteCapacityUnits: 10 /* required */
        }
      }
    ]
}

exports.createTables = function(){

  console.log("==> About to create DynamoDB tables!")

  const dynamodb = new AWS.DynamoDB({
    dynamodb: '2012-08-10',
    region: "us-east-1"
  })

  dynamodb.createTable(rentheroCommLogsTableParams, function(err, data) {
      if (err)
          console.log(JSON.stringify(err, null, 2));
      else
          console.log(JSON.stringify(data, null, 2));
  })
}
