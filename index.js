const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./lib/config");
const fs = require("fs");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

//dynamically set the port for what ever we set the config to.
httpServer.listen(config.httpPort, () => {
  console.log(`listening on ${config.httpPort} in ${config.envName} mode`);
});

let httpsSeverOption = {
  ket: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
//dynamically set the port for what ever we set the config to on the Https server.

const httpsServer = https.createServer(httpsSeverOption, (req, res) => {
  unifiedServer(req, res);
});

// Instantiate the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`listening on ${config.httpsPort} in ${config.envName} mode`);
});

const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get query string as an Object

  const queryStringObject = parsedUrl.query;

  // Get the HTTP  method (Like Get Post or Delete etc..)
  const method = req.method.toLowerCase();

  const headers = req.headers;

  // payLoad(Stream of Data)
  //Large Data received as small amount at a time
  // after the data emitts the little pieces of data
  //the buffer will have it as a long String

  let decoder = new StringDecoder("utf-8");
  // buffer = placehoder for a string
  let buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();

    // choose the handler if exist , otherwise go to not found.

    const chooseHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // construct the data object to send the handler

    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      // We want the parsed data not the row
      payload: helpers.parseJsonToObject(buffer),
    };

    //Route the requist to the handler specified in the router
    chooseHandler(data, (statusCode, payload) => {
      // Use the statusCode called back by the handler , ot default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      // Use the payload called by the handler , or default to an empty object
      payload = typeof payload == "object" ? payload : {};

      //Convert the Payload  to String

      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Contant-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("this is the response : " + statusCode, payloadString);
    });
  });
};

// requist router

let router = {
  sample: handlers.sample,

  // we don't have to define the not found handler in the router

  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};
