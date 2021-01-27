
//////require express.////////
const express = require('express');
const path = require('path');
var crypto = require('crypto');
var fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 1002;
const decode = require('urldecode');

//////////////set the html file path //////////////////////
app.set(express.static(path.join(__dirname, '/view/completion.html')));
app.set(express.static(path.join(__dirname, '/view/failed.html')));

////////////use urlencode to get data data from the 2c2p url//////////////
//Here the output of the successfull transaction is comes in the request of the returnUrl/////////
app.use(express.urlencoded({extended: false}));
app.post('/view', (req, res) => {
    console.log("hello--------------------")
    var reqdata = req.body;
    console.log(reqdata)


    //////////verify the hash to confirm that response comes from the 2c2p is accurate///////
    var b = crypto.createHmac("sha256", "7jYcp4FxFdf0");
    let signed = b.update(Buffer.from(reqdata.version + reqdata.request_timestamp + reqdata.merchant_id + reqdata.order_id + reqdata.invoice_no + reqdata.currency +
        reqdata.amount + reqdata.transaction_ref + reqdata.approval_code + reqdata.eci + reqdata.transaction_datetime + reqdata.payment_channel +
        reqdata.payment_status + reqdata.channel_response_code + reqdata.channel_response_desc + reqdata.masked_pan + reqdata.stored_card_unique_id +
        reqdata.backend_invoice + reqdata.paid_channel + reqdata.paid_agent + reqdata.recurring_unique_id + reqdata.user_defined_1 + reqdata.user_defined_2 +
        reqdata.user_defined_3 + reqdata.user_defined_4 + reqdata.user_defined_5 + reqdata.browser_info + reqdata.ippPeriod + reqdata.ippInterestType +
        reqdata.ippInterestRate + reqdata.ippMerchantAbsorbRate + reqdata.payment_scheme + reqdata.process_by + reqdata.sub_merchant_list, 'utf-8')).digest("hex")
    var hash = {}
    hash["hash_value"] = signed

    if (reqdata.hash_value.toLowerCase() === hash.hash_value) {
        console.log("correct info......Good to Goo")
        res.sendFile(__dirname + '/view/completion.html')
    } else {
        console.log("invalid response......[DONT USE IT]....")
        res.sendFile(__dirname + '/view/failed.html')
    }


})

///////////////payment api///////////////
app.get('/checkout', (req, res) => {
    var ref = new Date().getTime();
    var b = crypto.createHmac("sha256", "7jYcp4FxFdf0")
    var details = {

        merchant_id: "JT01",                                       //this merchant id is only for testing purpose...
        payment_description: '2 days 1 night hotel room',
        order_id: ref,
        currency: "702",                                            //currency-code////select your currency code ..what currency you want/////
        amount: '000000025000',
        version: "8.5",
        request_3ds: "Y",
        payment_url: "https://demo2.2c2p.com/2C2PFrontEnd/RedirectV3/payment",

        result_url_1: "http://localhost:1002/view",

    }

    ////////////create hash value to protect from fraud transactions/////////////
    let hash_value = b.update(Buffer.from(details.version + details.merchant_id + details.payment_description + details.order_id +
        details.currency + details.amount + details.result_url_1 + details.request_3ds, 'utf-8')).digest("hex")

    details["hash_value"] = hash_value



    //////////redirect to 2c2p checkout page//////////////use card details<<<<<<4242424242424242>>>>>>>and future date for expairy date////////////////////////
    fetch(details.payment_url, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(details)
    }).then((data) => {
        console.log(data.url)
        if (data.url.includes("payment/Error")) {
            let url = data.url
            let getUrl = url.split('?')
            let newUrl = getUrl[1].split('&')
            let result_desc = newUrl[1].split('=')
            let message = decode(result_desc[1])
            let errorcode = newUrl[0].split('=')
            var result = {
                errorCode: errorcode[1],
                message: message
            }
            console.log(result)

            res.redirect(data.url)

        } else {
            res.redirect(data.url)
        }



    })
})
app.listen(port, function (error) {
    if (error) throw error
    console.log("Server created Successfully")
})