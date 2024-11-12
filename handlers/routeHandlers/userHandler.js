const { error } = require("console");
const lib = require("../../lib/data");
const { hash, parseJSON } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");

const handler = {};

handler.userHandler = (requestedProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
    handler._users[requestedProperties.method](requestedProperties, callback);
  } else {
    callback(405);
  }
};

handler._users = {};

handler._users.post = (requestedProperties, callback) => {
  const firstName =
    typeof requestedProperties.body.firstName === "string" &&
    requestedProperties.body.firstName.trim().length > 0
      ? requestedProperties.body.firstName
      : false;
  const lastName =
    typeof requestedProperties.body.lastName === "string" &&
    requestedProperties.body.lastName.trim().length > 0
      ? requestedProperties.body.lastName
      : false;
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
  const agreement =
    typeof requestedProperties.body.agreement === "boolean" &&
    requestedProperties.body.agreement
      ? requestedProperties.body.agreement
      : false;

  if (firstName && lastName && phone && password && agreement) {
    lib.read("users", phone, (err1) => {
      if (err1) {
        const userInfo = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          agreement,
        };
        lib.create("users", phone, userInfo, (err2) => {
          if (!err2) {
            callback(200, {
              message: "User created successfully",
            });
          } else {
            callback(500, {
              error: "Error creating user",
            });
          }
        });
      } else {
        callback(500, {
          error: "User already exists",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

handler._users.get = (requestedProperties, callback) => {
  const phone =
    typeof requestedProperties.queryStringObject.phone === "string" &&
    requestedProperties.queryStringObject.phone.trim().length === 11
      ? requestedProperties.queryStringObject.phone
      : false;
  if (phone) {
    const token =
      typeof requestedProperties.headersObject.token === "string"
        ? requestedProperties.headersObject.token
        : false;
    if (token) {
      tokenHandler._token.verify(token, phone, (tokenID) => {
        if (tokenID) {
          lib.read("users", phone, (err, u) => {
            const user = { ...parseJSON(u) };
            if (!err && user) {
              delete user.password;
              callback(200, user);
            } else {
              callback(404, { error: "Requested user was not found" });
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
    callback(404, { error: "Requested user was not found" });
  }
};

handler._users.put = (requestedProperties, callback) => {
  const firstName =
    typeof requestedProperties.body.firstName === "string" &&
    requestedProperties.body.firstName.trim().length > 0
      ? requestedProperties.body.firstName
      : false;
  const lastName =
    typeof requestedProperties.body.lastName === "string" &&
    requestedProperties.body.lastName.trim().length > 0
      ? requestedProperties.body.lastName
      : false;
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

  if (phone) {
    if (firstName || lastName || password) {
      const token =
        typeof requestedProperties.headersObject.token === "string"
          ? requestedProperties.headersObject.token
          : false;
      if (token) {
        tokenHandler._token.verify(token, phone, (tokenID) => {
          if (tokenID) {
            lib.read("users", phone, (err1, u) => {
              const user = { ...parseJSON(u) };
              if (!err1 && user) {
                if (firstName) {
                  user.firstName = firstName;
                }
                if (lastName) {
                  user.lastName = lastName;
                }
                if (password) {
                  user.password = hash(password);
                }
                lib.update("users", phone, user, (err2) => {
                  if (!err2) {
                    callback(200, { message: "User updated successfully" });
                  } else {
                    callback(500, { error: "Error in server side" });
                  }
                });
              } else {
                callback(400, { error: "Problem in your request" });
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
  } else {
    callback(400, { error: "Problem in your request" });
  }
};

handler._users.delete = (requestedProperties, callback) => {
  const phone =
    typeof requestedProperties.body.phone === "string" &&
    requestedProperties.body.phone.trim().length === 11
      ? requestedProperties.body.phone
      : false;

  if (phone) {
    const token =
      typeof requestedProperties.headersObject.token === "string"
        ? requestedProperties.headersObject.token
        : false;
    if (token) {
      tokenHandler._token.verify(token, phone, (tokenID) => {
        if (tokenID) {
          lib.read("users", phone, (err) => {
            if (!err) {
              lib.delete("users", phone, (err2) => {
                if (!err2) {
                  callback(200, { message: "User deleted successfully" });
                } else {
                  callback(400, { error: "Error deleting user" });
                }
              });
            } else {
              callback(400, { error: "No such user found" });
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

module.exports = handler;
