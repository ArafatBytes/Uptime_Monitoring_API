const crypto = require("crypto");
const environment = require("./environment");

const utilities = {};

utilities.parseJSON = (jsonString) => {
  let output;

  try {
    output = JSON.parse(jsonString);
  } catch {
    output = {};
  }
  return output;
};

utilities.hash = (str) => {
  if (typeof str === "string" && str.length > 0) {
    console.log(environment, process.env.NODE_ENV);
    const hash = crypto
      .createHmac("sha256", environment.secretKey)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

utilities.createToken = (strlen) => {
  const length = typeof strlen === "number" && strlen > 0 ? strlen : false;
  if (length) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
    let output = "";
    for (let i = 0; i < length; i++) {
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      output += randomCharacter;
    }
    return output;
  } else {
    return false;
  }
};

module.exports = utilities;
