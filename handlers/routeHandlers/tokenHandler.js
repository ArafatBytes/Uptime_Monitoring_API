const { error } = require("console");
const lib = require("../../lib/data");
const { hash, parseJSON, createToken } = require("../../helpers/utilities");
const { parse } = require("path");

const handler = {};

handler.tokenHandler = (requestedProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
    handler._token[requestedProperties.method](requestedProperties, callback);
  } else {
    callback(405);
  }
};

handler._token = {};

handler._token.post = (requestedProperties, callback) => {
  const phone =
    typeof requestedProperties.body.phone === "string" &&
    requestedProperties.body.phone.trim().length === 11
      ? requestedProperties.body.phone
      : false;
  const password =
    typeof requestedProperties.body.password === "string" &&
    requestedProperties.body.password.trim().length > 0
      ? requestedProperties.body.password
      : false;

  if (phone && password) {
    lib.read("users", phone, (err, userData) => {
      if (!err && userData) {
        const hashedPassword = hash(password);
        if (hashedPassword === parseJSON(userData).password) {
          const tokenID = createToken(20);
          const expires = Date.now() + 60 * 60 * 1000;
          const tokenInfo = {
            id: tokenID,
            expires,
            phone,
          };
          lib.create("tokens", tokenID, tokenInfo, (err2) => {
            if (!err2) {
              callback(200, {
                message: "Token created succesfully",
                tokenInfo,
              });
            } else {
              callback(400, { error: "Error creating token" });
            }
          });
        } else {
          callback(400, { error: "Password does not match" });
        }
      } else {
        callback(400, { error: "No such user found" });
      }
    });
  } else {
    callback(400, { error: "Problem in request" });
  }
};

handler._token.get = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.queryStringObject.id === "string" &&
    requestedProperties.queryStringObject.id.trim().length === 20
      ? requestedProperties.queryStringObject.id
      : false;
  if (id) {
    lib.read("tokens", id, (err, u) => {
      const user = { ...parseJSON(u) };
      if (!err && user) {
        callback(200, user);
      } else {
        callback(404, { error: "Requested user was not found" });
      }
    });
  } else {
    callback(400, { error: "Requested user was not found" });
  }
};

handler._token.put = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.body.id === "string" &&
    requestedProperties.body.id.trim().length === 20
      ? requestedProperties.body.id
      : false;
  const extend =
    typeof requestedProperties.body.extend === "boolean" &&
    requestedProperties.body.extend === true
      ? true
      : false;

  if (id && extend) {
    lib.read("tokens", id, (err, tokenData) => {
      const tokenObject = { ...parseJSON(tokenData) };
      if (tokenObject.expires > Date.now()) {
        tokenObject.expires = Date.now() + 60 * 60 * 1000;
        lib.update("tokens", id, tokenObject, (err2) => {
          if (!err2) {
            callback(200, { message: "Updated token successfully" });
          } else {
            callback(404, { error: "Error updating token" });
          }
        });
      } else {
        callback(404, { error: "Token expired" });
      }
    });
  } else {
    callback(404, { error: "Error updating token" });
  }
};

handler._token.delete = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.queryStringObject.id === "string" &&
    requestedProperties.queryStringObject.id.trim().length === 20
      ? requestedProperties.queryStringObject.id
      : false;

  if (id) {
    lib.read("tokens", id, (err) => {
      if (!err) {
        lib.delete("tokens", id, (err2) => {
          if (!err2) {
            callback(200, { message: "Token deleted successfully" });
          } else {
            callback(400, { error: "Error deleting token" });
          }
        });
      } else {
        callback(400, { error: "No such token found" });
      }
    });
  } else {
    callback(400, { error: "Problem in your request" });
  }
};

handler._token.verify = (id, phone, callback) => {
  lib.read("tokens", id, (err, data) => {
    if (!err && data) {
      if (
        parseJSON(data).phone === phone &&
        parseJSON(data).expires > Date.now()
      ) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handler;
