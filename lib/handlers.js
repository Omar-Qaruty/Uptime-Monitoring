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
    data.payload.phone.trim().length == 10
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
//Required Data : phone

// Only let authanticated users to their data object.

handlers._users.get = (data, callback) => {
  // console.log(typeof data.queryStringObject);
  // console.log(data.queryStringObject.phone.trim());
  // console.log(data.queryStringObject.phone.trim().length);
  // console.log(typeof data.queryStringObject.phone);
  // console.log(typeof data.queryStringObject.phone == "string");
  // console.log(data.queryStringObject.phone.trim().length == 10);
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user user object before returning it to the requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
    console.log(data);
    console.log(phone);
  }
};

// Required data : phone.
// Optional data : firstName , lastName , password (at least one must be specified)
// Only let authenticated user update their data object.
handlers._users.put = (data, callback) => {
  // Check for the required field.

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the opetinal fields

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

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 10
      ? data.payload.password.trim()
      : false;

  //  Error if the is invalid
  if (phone) {
    // Error if nothing sent to update
    if (firstName || lastName || password) {
      // Look up the user.
      _data.read("users", phone, (err, userData) => {
        if (!err && userData) {
          // Update the required fields.
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }

          // Store the updated data.
          _data.update("users", phone, userData, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not update the user" });
            }
          });
        } else {
          callback(400, { Error: "The specified user dose not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Required fields : phone.
// Only let the authenticated user delete thier data object.
// cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
  // Check the phone is valid.
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        _data.delete("users", phone, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified user" });
          }
        });
        callback(200, data);
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

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
