const { parseJSON } = require("../helpers/utilities");
const lib = require("./data");
const url = require("url");
const http = require("http");
const https = require("https");
const { sendTwilioSms } = require("../helpers/notifications");

const worker = {};

worker.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} for ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;
  sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log(`User was alerted using a text message ${msg}`);
    } else {
      console.log("Error: Could not send alert to user");
    }
  });
};

worker.processCheckOutcome = (data, checkOutcome) => {
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    data.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";
  const alertWanted = data.lastChecked && data.state !== state ? true : false;
  const newCheckData = data;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();
  lib.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log("ALert is not needed as there is no change in state");
      }
    } else {
      console.log("Error: Can not update check data");
    }
  });
};

worker.performCheck = (data) => {
  let checkOutcome = {
    error: false,
    responseCode: false,
  };
  let outcomeSent = false;
  const parsedUrl = url.parse(`${data.protocol}://${data.url}`, true);
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path;
  const requestDetails = {
    protocol: `${data.protocol}:`,
    hostname: hostName,
    method: data.method.toUpperCase(),
    path,
    timeout: data.timeoutSeconds * 1000,
  };
  const protocolToUse = data.protocol === "http" ? http : https;
  const req = protocolToUse.request(requestDetails, (res) => {
    const status = res.statusCode;
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  });
  req.on("error", (e) => {
    checkOutcome = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  });
  req.on("timeout", () => {
    checkOutcome = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  });
  req.end();
};

worker.validateCheckData = (checkData) => {
  const data = checkData;
  if (data && data.id) {
    data.state =
      typeof data.state === "string" && ["up", "down"].indexOf(data.state) > -1
        ? data.state
        : "down";
    data.lastChecked =
      typeof data.lastChecked === "number" && data.lastChecked > 0
        ? data.lastChecked
        : false;

    worker.performCheck(data);
  } else {
    console.log("Error: check was invalid");
  }
};

worker.gatherAllChecks = () => {
  lib.list("checks", (err, checks) => {
    if (!err && checks.length > 0) {
      checks.forEach((check) => {
        lib.read("checks", check, (err2, checkData) => {
          if (!err2 && checkData) {
            worker.validateCheckData(parseJSON(checkData));
          } else {
            console.log("Error: Reading check data failed");
          }
        });
      });
    } else {
      console.log("Error: No checks were found");
    }
  });
};

worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 5000);
};

worker.init = () => {
  worker.gatherAllChecks();

  worker.loop();
};

module.exports = worker;
