const RENTHERO_COMM_LOGS = require('../dynamodb_tablenames').RENTHERO_COMM_LOGS


// ====================================

exports.reference_items = [
  {
    'TableName': RENTHERO_COMM_LOGS,
    'Item': {
      'MESSAGE_ID': 'uuid.v4()',
      'CHANNEL_ID': 'STRING_FROM_TWILIO',
      'DATETIME': 43563456456,
      'TIMEZONE': 'UTC-05',
      'STAFF_ID': 'CHATBOT_ID' || 'STAFF_ID',
      'MEDIUM': 'SMS',
      'CONTACT_ID': 'TENANT_ID',
      'CORPORATION_ID': 'Landlords Corp',
      'SENDER_ID': 'proxyemail' || 'CONTACT_ID',
      'CHANNEL_ID_DATETIME': 'STRING_FROM_TWILIO+43563456456',
      'MESSAGE': 'Hello is this still available?'
    }
  },
  {
    'TableName': RENTHERO_COMM_LOGS,
    'Item': {
      'MESSAGE_ID': 'uuid.v4()',
      'CHANNEL_ID': 'STRING_FROM_TWILIO',
      'DATETIME': 43563456456,
      'TIMEZONE': 'UTC-05',
      'STAFF_ID': 'CHATBOT_ID' || 'STAFF_ID',
      'MEDIUM': 'EMAIL', // initial email
      'CONTACT_ID': 'CONTACT_ID',
      'CORPORATION_ID': 'Landlords Corp',
      'CHANNEL_ID_DATETIME': 'STRING_FROM_TWILIO+43563456456',
      'MESSAGE': 'Following up on the same suite',
      'S3_LOCATION': 'https://s3-aws.us-east-1.renthero/3984jaslf43.json',
      'SENDER_ID': 'proxyemail' || 'CONTACT_ID'
    }
  },
  {
    'TableName': RENTHERO_COMM_LOGS,
    'Item': {
      'MESSAGE_ID': 'uuid.v4()',
      'CHANNEL_ID': 'STRING_FROM_TWILIO',
      'DATETIME': 43563456456,
      'TIMEZONE': 'UTC-05',
      'STAFF_ID': 'CHATBOT_ID' || 'STAFF_ID',
      'MEDIUM': 'INITIAL_EMAIL',
      'CORPORATION_ID': 'Landlords Corp',
      'CONTACT_ID': 'TENANT_ID',
      'CHANNEL_ID_DATETIME': 'STRING_FROM_TWILIO+43563456456',
      'MESSAGE': 'Wondering about this suite',
      'S3_LOCATION': 'https://s3-aws.us-east-1.renthero/3984jaslf43.json',
      'SENDER_ID': 'proxyemail' || 'CONTACT_ID'
    }
  },
  {
    'TableName': RENTHERO_COMM_LOGS,
    'Item': {
      'MESSAGE_ID': 'uuid.v4()',
      'CHANNEL_ID': 'STRING_FROM_TWILIO',
      'DATETIME': 43563456456,
      'TIMEZONE': 'UTC-05',
      'SENDER_ID': 'proxyemail' || 'CONTACT_ID',
      'STAFF_ID': 'CHATBOT_ID' || 'STAFF_ID',
      'CORPORATION_ID': 'Landlords Corp',
      'MEDIUM': 'FBMESSENGER',
      'CONTACT_ID': 'TENANT_ID',
      'CHANNEL_ID_DATETIME': 'STRING_FROM_TWILIO+43563456456',
      'MESSAGE': 'Still available?'
    }
  }
]
