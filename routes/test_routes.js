const extract_phone = require('../api/gmail_webhook/extraction_api').extract_phone
const incoming_email = require('../index').incoming_email

// GET /test
exports.test = function(req, res, next){
  res.json({
    message: "Test says alive and well"
  })
}

exports.test_phone = function(req, res, next) {
  const text = `Hello Sarah,\r\n\r\nWhat is your price range, and are you ok with roommates if there are no one\r\nbedrooms in your price range?\r\n\r\nYou can check out https://RentHero.ca to view all Waterloo housing in a\r\nbetter format.\r\n\r\nBest regards,\r\nThe RentHero Team\r\n\r\nOn Jan 30, 2018 1:58 PM, "sarah" <b-zfvw6z72xs51g@rts.kijiji.ca> wrote:\r\n\r\n> Hello! The following is a reply to your "RentHero - Don\'t Sign Until You\r\n> Compare!\r\n> <http://www.kijiji.ca/v-room-rental-roommate/kitchener-waterloo/renthero-dont-sign-until-you-compare/1316837599>"\r\n> Ad on Kijiji:\r\n>\r\n> *From:* sarah\r\n> interested in one bedroom apartment with own bathroom and shared kitchen.\r\n> university of waterloo student. please call (905)999-2115\r\n> <(905)%20999-2115>\r\n> *You can respond to "sarah" by replying to this email.*\r\n>\r\n> Other options:\r\n>\r\n>\r\n>    - Want more replies? Promote your ad\r\n>    <http://www.kijiji.ca/c-PromoteMyAds> through My Kijiji\r\n>    - Ad no longer relevant? Delete your ad\r\n>    <http://www.kijiji.ca/c-EndAdWarn?AdId=1316837599> from the original\r\n>    Manage My Ads email or from Kijiji.\r\n>\r\n>\r\n>\r\n> *Important Kijiji Safety Notice:*\r\n>\r\n>    - Take steps to make your Kijiji transactions as secure as possible by\r\n>    following our suggested safety tips. Read our Safety Tips\r\n>    <https://help.kijiji.ca/helpdesk/safety/>.\r\n>    - Never click links in an email that ask you to sign in to Kijiji. All\r\n>    "Your Kijiji account has expired" emails are fakes.\r\n>    - PayPal transactions made through the Kijiji app qualify for PayPalb\u0000\u0019s\r\n>    Seller Protection. Kijiji, Ebay and Paypal do not offer buyer protection\r\n>    for Kijiji items. See terms\r\n>    <https://www.paypal.com/ca/webapps/mpp/ua/kijiji-tnc?locale.x=en_CA>.\r\n>\r\n> *Email Masking*\r\n> Please note that we now automatically mask email addresses of buyers and\r\n> sellers on non-commercial ads. For your safety, we recommend you only use\r\n> the masked email address when replying to emails. To learn more, click\r\n> here <https://help.kijiji.ca/helpdesk/safety/masked-email-addresses>.\r\n> ------------------------------\r\n> Help <https://help.kijiji.ca/helpdesk/> About\r\n> <http://kijijiblog.ca/about-us/> Privacy Policy\r\n> <https://help.kijiji.ca/helpdesk/policies/kijiji-privacy-policy> Terms of\r\n> Use <https://help.kijiji.ca/helpdesk/policies/kijiji-terms-of-use> Contact\r\n> Kijiji <https://help.kijiji.ca/helpdesk/email-us/>\r\n> B) 2018 eBay International AG.\r\n> Operated by: Kijiji Canada Ltd. | 500 King Street West, Suite 200 |\r\n> Toronto, Ontario | M5V 1L9 | Canada\r\n> <https://maps.google.com/?q=500+King+Street+West,+Suite+200+%7C+Toronto,+Ontario+%7C+M5V+1L9+%7C+Canada&entry=gmail&source=g>\r\n>\r\n`
  extract_phone(text)
  .then((data) => {
    res.json({
      msg: data,
    })
  })
}

exports.mock_gmail_webhook = function(req, res, next) {
  incoming_email().then((data) => {
    res.json(data)
  })
}
