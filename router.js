// libraries
const bodyParser = require('body-parser')

// middleware
// const google_jwt_check = require('./auth/google_jwt_check').google_jwt_check
// const origin_check = require('./auth/origin_check').origin_check

// routes
const Test = require('./routes/test_routes')
// const AuthRoutes = require('./routes/auth_routes')

// bodyParser attempts to parse any request into JSON format
const json_encoding = bodyParser.json({type:'*/*'})

module.exports = function(app){

	// routes
	app.get('/test', json_encoding, Test.test)
	app.post('/mock_gmail_webhook', Test.mock_gmail_webhook)
}
