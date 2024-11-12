const { error } = require("console");
const { type } = require("os");
const lib = require("../../lib/data");
const { parseJSON, createToken } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");
const environmentToExport = require("../../helpers/environment");

const handler = {};

handler.checkHandler = (requestedProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
    handler._check[requestedProperties.method](requestedProperties, callback);
  } else {
    callback(405);
  }
};

handler._check = {};

handler._check.post = (requestedProperties, callback) => {
  const protocol =
    typeof requestedProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestedProperties.body.protocol) > -1
      ? requestedProperties.body.protocol
      : false;
  const url =
    typeof requestedProperties.body.url === "string" &&
    requestedProperties.body.url.trim().length > 0
      ? requestedProperties.body.url
      : false;
  const method =
    typeof requestedProperties.body.method === "string" &&
    ["get", "post", "put", "delete"].indexOf(requestedProperties.body.method) >
      -1
      ? requestedProperties.body.method
      : false;
  const successCodes =
    typeof requestedProperties.body.successCodes === "object" &&
    requestedProperties.body.successCodes instanceof Array
      ? requestedProperties.body.successCodes
      : false;
  const timeoutSeconds =
    typeof requestedProperties.body.timeoutSeconds === "number" &&
    requestedProperties.body.timeoutSeconds % 1 === 0 &&
    requestedProperties.body.timeoutSeconds >= 1 &&
    requestedProperties.body.timeoutSeconds <= 5
      ? requestedProperties.body.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    const token =
      typeof requestedProperties.headersObject.token === "string"
        ? requestedProperties.headersObject.token
        : false;
    if (token) {
      lib.read("tokens", token, (err, tokenData) => {
        if (!err && tokenData) {
          const userPhone = parseJSON(tokenData).phone;
          lib.read("users", userPhone, (err2, userData) => {
            if (!err2 && userData) {
              tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                if (tokenIsValid) {
                  const userObject = { ...parseJSON(userData) };
                  const userChecks =
                    typeof userObject.checks === "object" &&
                    userObject.checks instanceof Array
                      ? userObject.checks
                      : [];
                  if (userChecks.length < environmentToExport.maxChecks) {
                    const checkId = createToken(20);
                    const checkObject = {
                      id: checkId,
                      userPhone,
                      protocol,
                      url,
                      method,
                      successCodes,
                      timeoutSeconds,
                    };
                    lib.create("checks", checkId, checkObject, (err3) => {
                      if (!err3) {
                        userObject.checks = userChecks;
                        userObject.checks.push(checkId);
                        lib.update("users", userPhone, userObject, (err4) => {
                          if (!err4) {
                            callback(200, {
                              message: "Check object created successfully",
                              checkObject,
                            });
                          } else {
                            callback(500, {
                              error: "Error creating check object",
                            });
                          }
                        });
                      } else {
                        callback(500, { error: "Error creating check object" });
                      }
                    });
                  } else {
                    callback(500, { error: "Max check size reached" });
                  }
                } else {
                  callback(403, { error: "Authentication failure" });
                }
              });
            } else {
              callback(403, { error: "Authentication failure" });
            }
          });
        } else {
          callback(403, { error: "Authentication failure" });
        }
      });
    } else {
      callback(403, { error: "Authentication failure" });
    }
  } else {
    callback(400, { error: "Problem in your request" });
  }
};

handler._check.get = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.queryStringObject.id === "string" &&
    requestedProperties.queryStringObject.id.trim().length === 20
      ? requestedProperties.queryStringObject.id
      : false;
  if (id) {
    lib.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestedProperties.headersObject.token === "string"
            ? requestedProperties.headersObject.token
            : false;
        if (token) {
          tokenHandler._token.verify(
            token,
            parseJSON(checkData).userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                callback(200, parseJSON(checkData));
              } else {
                callback(403, { error: "Authentication failure" });
              }
            }
          );
        } else {
          callback(403, { error: "Authentication failure" });
        }
      } else {
        callback(400, { error: "Error in your request" });
      }
    });
  } else {
    callback(400, { error: "Error in your request" });
  }
};

handler._check.put = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.body.id === "string" &&
    requestedProperties.body.id.trim().length === 20
      ? requestedProperties.body.id
      : false;
  const protocol =
    typeof requestedProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestedProperties.body.protocol) > -1
      ? requestedProperties.body.protocol
      : false;
  const url =
    typeof requestedProperties.body.url === "string" &&
    requestedProperties.body.url.trim().length > 0
      ? requestedProperties.body.url
      : false;
  const method =
    typeof requestedProperties.body.method === "string" &&
    ["get", "post", "put", "delete"].indexOf(requestedProperties.body.method) >
      -1
      ? requestedProperties.body.method
      : false;
  const successCodes =
    typeof requestedProperties.body.successCodes === "object" &&
    requestedProperties.body.successCodes instanceof Array
      ? requestedProperties.body.successCodes
      : false;
  const timeoutSeconds =
    typeof requestedProperties.body.timeoutSeconds === "number" &&
    requestedProperties.body.timeoutSeconds % 1 === 0 &&
    requestedProperties.body.timeoutSeconds >= 1 &&
    requestedProperties.body.timeoutSeconds <= 5
      ? requestedProperties.body.timeoutSeconds
      : false;
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      lib.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          const checkObject = parseJSON(checkData);
          const token =
            typeof requestedProperties.headersObject.token === "string"
              ? requestedProperties.headersObject.token
              : false;
          tokenHandler._token.verify(
            token,
            checkObject.userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                if (protocol) {
                  checkObject.protocol = protocol;
                }
                if (url) {
                  checkObject.url = url;
                }
                if (method) {
                  checkObject.method = method;
                }
                if (successCodes) {
                  checkObject.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkObject.timeoutSeconds = timeoutSeconds;
                }
                lib.update("checks", id, checkObject, (err2) => {
                  if (!err2) {
                    callback(200, checkObject);
                  } else {
                    callback(400, { error: "Error updating checks" });
                  }
                });
              } else {
                callback(403, { error: "Authentication error" });
              }
            }
          );
        } else {
          callback(400, { error: "Error in your request" });
        }
      });
    } else {
      callback(400, { error: "Error in your request" });
    }
  } else {
    callback(400, { error: "Error in your request" });
  }
};

handler._check.delete = (requestedProperties, callback) => {
  const id =
    typeof requestedProperties.queryStringObject.id === "string" &&
    requestedProperties.queryStringObject.id.trim().length === 20
      ? requestedProperties.queryStringObject.id
      : false;
  if (id) {
    lib.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestedProperties.headersObject.token === "string"
            ? requestedProperties.headersObject.token
            : false;
        tokenHandler._token.verify(
          token,
          parseJSON(checkData).userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              lib.delete("checks", id, (err2) => {
                if (!err2) {
                  lib.read(
                    "users",
                    parseJSON(checkData).userPhone,
                    (err3, userInfo) => {
                      const userObject = parseJSON(userInfo);
                      if (!err3 && userObject) {
                        const userChecks =
                          typeof userObject.checks === "object" &&
                          userObject.checks instanceof Array
                            ? userObject.checks
                            : [];
                        const position = userChecks.indexOf(id);
                        if (position > -1) {
                          userChecks.splice(position, 1);
                          userObject.checks = userChecks;
                          lib.update(
                            "users",
                            userObject.phone,
                            userObject,
                            (err4) => {
                              if (!err4) {
                                callback(200, {
                                  message: "User check successfully deleted",
                                });
                              } else {
                                callback(400, {
                                  error: "Error deleting user check",
                                });
                              }
                            }
                          );
                        } else {
                          callback(401, { error: "Error deleting user check" });
                        }
                      } else {
                        callback(402, { error: "Error deleting user check" });
                      }
                    }
                  );
                } else {
                  callback(400, { error: "Error deleting checks" });
                }
              });
            } else {
              callback(403, { error: "Authentication failure" });
            }
          }
        );
      } else {
        callback(400, { error: "Problem in your request" });
      }
    });
  } else {
    callback(400, { error: "Problem in your request" });
  }
};

module.exports = handler;
