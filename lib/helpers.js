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

//  Create a string of random alohanumaric charcters, of given length.
helpers.createRandomString = (strLength) => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define the possible characters could go into a string.
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    // Start the final string.
    let str = "";
    for (i = 1; i <= strLength; i++) {
      // get a random character from the possibleCharacters string.
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the final string.
      str += randomCharacter;
    }
    // return the final string.
    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
