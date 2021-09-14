const _data = require("./data");
const helpers = require("./helpers");

// define the handlers
let handlers = {};

// Users
handlers.users = (data, callback) => {
  // figure out what method you're requisting then pass it along to a subhandlers
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    // 405 http status code for method not allowed.
    callback(405);
  }
};
// Container for the users submethods
handlers._users = {};

handlers._users.get = (data, callback) => {};

handlers._users.post = (data, callback) => {
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 10
      ? data.payload.password.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;
  console.log(firstName, lastName, password, phone, tosAgreement);
  if (firstName && lastName && password && phone && tosAgreement) {
    // MAke sure that the user dosent already exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // create tha user object.
          const userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true,
          };

          // store the user
          _data.create("users", phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        // user alredy exist
        callback(400, { Error: "a user with phone number already exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};
handlers._users.put = (data, callback) => {};
handlers._users.delete = (data, callback) => {};

handlers.ping = (data, callback) => {
  callback(200);
};

// // sample handler
handlers.sample = (data, callback) => {
  // Call back http status code , and a payload object.
  callback(406, { name: "sample handler" });
};
// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
