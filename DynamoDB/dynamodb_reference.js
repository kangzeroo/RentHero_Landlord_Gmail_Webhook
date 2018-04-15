
const AWS = require('aws-sdk')
const aws_config = require('../credentials/aws_config')
const dynaDoc = require("dynamodb-doc")
AWS.config.update(aws_config)
const Rx = require('rxjs')

const dynamodb = new AWS.DynamoDB({
  dynamodb: '2012-08-10',
  region: "us-east-1"
})
const docClient = new dynaDoc.DynamoDB(dynamodb)

exports.query_dynamodb = function(params) {
  /*
  	"params": {
        "TableName": "Building_Interactions_Intel",
        "KeyConditionExpression": "#BUILDING_ID = :building_id",
        "IndexName": "By_Local_UserId",
        "FilterExpression": "#ACTION = :action1 AND #DATE > :date",
        "ExpressionAttributeNames": {
          "#BUILDING_ID": "BUILDING_ID",
          "#ACTION": "ACTION",
          "#DATE": "DATE"
        },
        "ExpressionAttributeValues": {
          ":building_id": "d2daa19f-128f-4043-af84-c1baa970ab81",
          ":action1": "BUILDING_PAGE_LOADED",
          ":date": 1512940693
        }
      }
  */
  const p = new Promise((res, rej) => {
    let Items = []
    const onNext = ({ obs, params }) => {
      setTimeout(() => {
        console.log('OBSERVABLE NEXT')
        console.log('=========== accumlated size: ' + Items.length)

        docClient.query(params, function(err, data) {
          if (err){
            console.log(err, err.stack); // an error occurred
            obs.error(err)
          }else{
            console.log(data);           // successful response
            Items = Items.concat(data.Items)
            if (data.LastEvaluatedKey) {
              params.ExclusiveStartKey = data.LastEvaluatedKey
              obs.next({
                obs,
                params
              })
            } else {
              obs.complete(data)
            }
          }
        })
      }, 1500)
    }
    Rx.Observable.create((obs) => {
      obs.next({
        obs,
        params
      })
    }).subscribe({
      next: onNext,
      error: (err) => {
        console.log('OBSERVABLE ERROR')
        console.log(err)
      },
      complete: (y) => {
        console.log('OBSERVABLE COMPLETE')
        console.log(Items.length)
        res(Items)
      }
    })
  })
  return p
}


exports.scan_dynamodb = function(params) {
  /*
  	"params": {
        "TableName": "Building_Interactions_Intel",
        "IndexName": "By_Local_UserId",
        "FilterExpression": "#ACTION = :action1 AND #DATE > :date",
        "ExpressionAttributeNames": {
          "#ACTION": "ACTION",
          "#DATE": "DATE"
        },
        "ExpressionAttributeValues": {
          ":action1": "BUILDING_PAGE_LOADED",
          ":date": 1512940693
        }
      }
  */
  const p = new Promise((res, rej) => {
    let Items = []
    const onNext = ({ obs, params }) => {
      setTimeout(() => {
        console.log('OBSERVABLE NEXT')
        console.log('=========== accumlated size: ' + Items.length)
        docClient.scan(params, (err, data) => {
          if (err){
            console.log(err, err.stack); // an error occurred
            obs.error(err)
          }else{
            console.log(data);           // successful response
            Items = Items.concat(data.Items)
            if (data.LastEvaluatedKey) {
              params.ExclusiveStartKey = data.LastEvaluatedKey
              obs.next({
                obs,
                params
              })
            } else {
              obs.complete(data)
            }
          }
        })
      }, 1500)
    }
    Rx.Observable.create((obs) => {
      obs.next({
        obs,
        params
      })
    }).subscribe({
      next: onNext,
      error: (err) => {
        console.log('OBSERVABLE ERROR')
        console.log(err)
      },
      complete: (y) => {
        console.log('OBSERVABLE COMPLETE')
        console.log(Items.length)
        res(Items)
      }
    })
  })
  return p
}

// to insert or update an entry
exports.insertItem = function(item){
  const p = new Promise((res, rej) => {
    // const item = {
    //   'TableName': 'TABLE_NAME',
    //   'Item': { ...data },
    // }
    docClient.putItem(item, function(err, data) {
      if (err){
          console.log(JSON.stringify(err, null, 2));
          rej(err)
      }else{
          console.log('DYNAMODB INSERTION SUCCESS!')
          res(data)
      }
    })
  })
  return p
}

exports.batchInsertItems = function(items){
  const p = new Promise((res, rej) => {
    console.log(items)
    if (items.length > 0) {
      const params = {
        RequestItems: {
          [items[0].TableName]: items.map((item) => {
            return {
              PutRequest: {
                Item: item.Item
              }
            }
          })
        }
      }
      docClient.batchWriteItem(params, function(err, data) {
        if (err){
            console.log(JSON.stringify(err, null, 2))
            rej(err)
        }else{
            console.log('DYNAMODB BATCH INSERTION SUCCESS!')
            res(data)
        }
      })
    }
  })
  return p
}
