const handler = {};

handler.notFoundHandler = (requestedProperties, callback) => {
  callback(404, {
    message: "url not found",
  });
};

module.exports = handler;
