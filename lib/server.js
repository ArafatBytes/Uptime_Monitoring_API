const http = require("http");
const { handleReqRes } = require("../helpers/handleReqRes");
const environment = require("../helpers/environment");

const server = {};

// sendTwilioSms("01818902332", "You can be the best. Don't lose hope", (err) => {
//   console.log(err);
// });

server.createServer = () => {
  const serverVariable = http.createServer(server.handleReqRes);
  serverVariable.listen(environment.port, () => {
    console.log(`listening to port ${environment.port}`);
  });
};

server.handleReqRes = handleReqRes;

server.init = () => {
  server.createServer();
};

module.exports = server;
