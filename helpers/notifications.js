const https = require("https");
const { twilio } = require("./environment");
const queryString = require("querystring");
const { hostname } = require("os");

const notifications = {};

notifications.sendTwilioSms = (phone, msg, callback) => {
  const userphone =
    typeof phone === "string" && phone.trim().length === 11
      ? phone.trim()
      : false;
  const usermsg =
    typeof msg === "string" &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg.trim()
      : false;

  if (userphone && usermsg) {
    const payload = {
      From: twilio.fromPhone,
      To: `+88${userphone}`,
      Body: usermsg,
    };
    const payloadString = queryString.stringify(payload);
    const requestDetails = {
      hostname: "api.twilio.com",
      method: "POST",
      path: `/2010-04-01/Accounts/${twilio.accountSID}/Messages.json`,
      auth: `${twilio.accountSID}:${twilio.authToken}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    const req = https.request(requestDetails, (res) => {
      const status = res.statusCode;
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback(`Given status code was ${status}`);
      }
    });
    req.on("error", (e) => {
      callback(e);
    });
    req.write(payloadString);
    req.end();
  } else {
    callback("Given parameters were invalid or missing");
  }
};

module.exports = notifications;
