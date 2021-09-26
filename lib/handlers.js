const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");

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
    // Get the token form the headers.
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verfiy that the given token is valid for the phone number.
    handlers._tokens.verfiyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
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
        callback(403, {
          Error:
            "Missing required token in the headers, or the token is expired",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
    // console.log(data);
    // console.log(phone);
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
      // Get the token form the headers.
      const token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      // verfiy that the given token is valid for the phone number.
      handlers._tokens.verfiyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
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
          callback(403, {
            Error:
              "Missing required token in the headers, or the token is expired",
          });
        }
      });

      // Look up the user.
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
  // Check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Get token from headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            // Delete the user's data
            _data.delete("users", phone, (err) => {
              if (!err) {
                // Delete each of the checks associated with the user
                const userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                const checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  const checksDeleted = 0;
                  const deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach((checkId) => {
                    // Delete the check
                    _data.delete("checks", checkId, (err) => {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully.",
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  // figure out what method you're requisting then pass it along to a subhandlers
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    // 405 http status code for method not allowed.
    callback(405);
  }
};

// container for all the token methods
handlers._tokens = {};

// Required data : phone , password.
handlers._tokens.post = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    // Lookup the user who matches that phone number

    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password , and compare it to tge password stored in the user object.
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If Valid Password, Create a new token with a random name and set the expiration to 1 hour.
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires,
          };

          // Store the token.
          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create a new Token" });
            }
          });
        } else {
          callback(400, {
            Error: "Password Did Not Match The Stored Password",
          });
        }
      } else {
        callback(400, { Error: "Could not find the spcified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s)" });
  }
};

// Required Data : id.

handlers._tokens.get = (data, callback) => {
  // Check if the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the user
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Required data : id,extend.
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    // Lookup the token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isnt expired.
        if (tokenData.expires > Date.now()) {
          // Set the expiraiton an hour from now.
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new update.
          _data.update("tokens", id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not extend the token's expiration.",
              });
            }
          });
        } else {
          console.log(tokenData);
          callback(400, {
            Error: "the token already expired, and connot be extended.",
          });
        }
      } else {
        callback(400, { Error: "Specified Token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required field(s) or field(s) invaild" });
  }
};

// Required data: id.
handlers._tokens.delete = (data, callback) => {
  // Check the id is valid.
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete("tokens", id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
        callback(200, tokenData);
      } else {
        callback(400, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Verify if a given token id is currently valid fora given user.
handlers._tokens.verfiyToken = (id, phone, callback) => {
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      // check if the token is for the given user and has not expired.
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers.checks = (data, callback) => {
  // figure out what method you're requisting then pass it along to a subhandlers
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    // 405 http status code for method not allowed.
    callback(405);
  }
};
// Container.
handlers._checks = {};
// Required checks, protocol(http,https),url,metohd,sucrssCodes, timeoutSecondes
handlers._checks.post = (data, callback) => {
  // Valdiate inputs.
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers.
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Lookup the user by reading the token.
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            // Verify that user has less than the number of max-checks per user
            if (userChecks.length < config.maxChecks) {
              // Create random id for check
              const checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              const checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              };

              // save the object.
              _data.create("checks", checkId, checkObject, (err) => {
                if (!err) {
                  // Add the checkId to the user's object.
                  //Adding the checks to the userChecks if thers no checks
                  userData.checks = userChecks;
                  // userData.checks contains possibly 1 check or all the previous checks pluse this one.
                  userData.checks.push(checkId);
                  // Save the new user data.
                  _data.update("users", userPhone, userData, (err) => {
                    if (!err) {
                      // Return the data about the new check.
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new checks",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check." });
                }
              });
            } else {
              callback(400, {
                Error: `the user already has the maximum number of checks ${config.maxChecks}`,
              });
            }
          } else {
            callback(403, { Error: "Something's wrong here too" });
          }
        });
      } else {
        callback(403, { Error: "Something's worng" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required inputs ,or inputs are invalid" });
  }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
  // Check that id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token that sent the request
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        console.log("This is check data", checkData);
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              // Return check data
              callback(200, checkData);
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field, or field invalid" });
  }
};
// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = (data, callback) => {
  // Check for required field
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Check for optional fields
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  // Error if id is invalid
  if (id) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token that sent the request
          const token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                // Update check data where necessary
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }

                // Store the new updates
                _data.update("checks", id, checkData, (err) => {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not update the check." });
                  }
                });
              } else {
                callback(403);
              }
            }
          );
        } else {
          callback(400, { Error: "Check ID did not exist." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};
// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = (data, callback) => {
  // Check that id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token that sent the request
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              // Delete the check data
              _data.delete("checks", id, (err) => {
                if (!err) {
                  // Lookup the user's object to get all their checks
                  _data.read("users", checkData.userPhone, (err, userData) => {
                    if (!err) {
                      const userChecks =
                        typeof userData.checks == "object" &&
                        userData.checks instanceof Array
                          ? userData.checks
                          : [];

                      // Remove the deleted check from their list of checks
                      const checkPosition = userChecks.indexOf(id);
                      if (checkPosition > -1) {
                        userChecks.splice(checkPosition, 1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update(
                          "users",
                          checkData.userPhone,
                          userData,
                          (err) => {
                            if (!err) {
                              callback(200);
                            } else {
                              callback(500, {
                                Error: "Could not update the user.",
                              });
                            }
                          }
                        );
                      } else {
                        callback(500, {
                          Error:
                            "Could not find the check on the user's object, so could not remove it.",
                        });
                      }
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the user who created the check, so could not remove the check from the list of checks on their user object.",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not delete the check data." });
                }
              });
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(400, { Error: "The check ID specified could not be found" });
      }
    });
  } else {
    callback(400, { Error: "Missing valid id" });
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
