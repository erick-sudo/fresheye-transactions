const express = require('express')
const cors = require('cors')

const port = process.env.PORT || 3000

const bp = require('body-parser')

const app = express()

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(cors())

async function initiateSTKPush(httpResponse, phoneNumber, accessToken) {
	//Get current Date and Time.
	const datetime = new Date()
	//Generating time stamp
	const timestamp = datetime.getFullYear()+datetime.getMonth().toString().padStart(2,'0')+datetime.getDay().toString().padStart(2,'0')+datetime.getHours().toString().padStart(2,'0')+datetime.getMinutes().toString().padStart(2,'0')+datetime.getSeconds().toString().padStart(2,'0')
	await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${accessToken}`
		},
		body: JSON.stringify({
			"BusinessShortCode": 174379,    
			"Password": Buffer.from(174379+"bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"+timestamp).toString('base64'),
			"Timestamp": timestamp,    
			"TransactionType": "CustomerPayBillOnline",    
			"Amount":"5",    
			"PartyA": phoneNumber,    
			"PartyB": 174379,    
			"PhoneNumber": phoneNumber,    
			"CallBackURL":"https://fresheye-transactions.herokuapp.com/paymentrecords",    
			"AccountReference":"FRESH-EYE",    
			"TransactionDesc":"Test"
		})
	})
	.then(res => res.json())
	.then(res => {
		httpResponse.send(res)
	});
}

async function  authorizationRequest(httpResponse, phoneNumber) {
	await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
		method: 'GET',
		headers: {
			'Authorization': 'Basic R2V3YXhFMnM0QWxOb1A1SUpBd0FsOEtaTVYzWUpUS0E6bmlLTWpkOXNobzM1SVA1RA=='
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.access_token) {
			//If the Access token is provided
			//console.log("Initiating STK Push request , Access_Token : "+ res.access_token)
			initiateSTKPush(httpResponse, phoneNumber, res.access_token);
		} else {
			//Handle no access token response
		}
	});
}

app.post('/buyticket', (req, res) => {

	console.log(req.body)

	//console.log(`${req.method.padStart(6, ' ')} ${req.path.padEnd(20, ' ')} ${new Date()}}`)

	const phonenumber = req.body.phonenumber ? req.body.phonenumber : undefined

	if(phonenumber) {
		const phone = parseInt("254"+phonenumber)
		authorizationRequest(res, phone)
	} else {
		res.status(400)
		res.send({ErrorCode: 400,"message": "No Phonenumber Specified"})
	}
})

app.post('/paymentrecords', (req, res) => {
	if(req.body.Body.stkCallback) {
		fetch("https://transactions-bank-of-flatiron.herokuapp.com/transactions", {
			method: 'POST',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(req.body.Body.stkCallback)
		})
		.then(res => res.json())
		.then(res => {
			console.log("Transaction Completed Succesfully")
		})
		.catch(err => {
			console.error("ERROR: " + err)
		})
	}
})

app.get('/', (req, res) => {
	res.send("<h1>FRESH EYE ENTERTAINMENT</h1>")
})

app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
