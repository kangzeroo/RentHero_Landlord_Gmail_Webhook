const uuid = require('uuid')
const AWS = require('aws-sdk')
const BUCKET_NAME = 'renthero-ai-email-records'
const AWS_S3 = new AWS.S3()

// PLEASE ENCRYPT TO S3, THANK YOU
exports.uploadToS3 = function(email, user_id, threadId){
  const name = `${user_id}--thread#${threadId}--${uuid.v4()}.json`
  // upload to S3 as a JSON file
  const p = new Promise((res, rej) => {
		AWS_S3.upload({
				Bucket: BUCKET_NAME,
		    Key: name,
		    Body: JSON.stringify(email),
		    ACL: 'public-read'
		}, (err, S3Object) => {
		    if (err) {
					console.log(err)
	      	const msg = `There was an error uploading the email: ${err.message}`
	      	rej(msg)
		    }
				const msg = `Successfully uploaded email ${name}`
				res(S3Object)
		})
  })
  return p
}
