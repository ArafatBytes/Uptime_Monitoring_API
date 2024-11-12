const handler = {};

handler.sampleHandler = (requestedProperties, callback) => {
  callback(200, {
    message: "This is a sample url",
  });
};

module.exports = handler;
