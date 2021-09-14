const crypto = require("crypto");
const config = require("./config");

// Container for all helpers.
const helpers = {};

// Create a SHA256 hash.
helpers.hash = (str) => {
  // Doesnt accept a callback because it will return the value
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Parsing a JSON string to an object in all cases , without throwing an Error.
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

module.exports = helpers;
