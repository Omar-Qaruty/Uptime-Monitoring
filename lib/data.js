// Library for storing and editing data

const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the module (to be exported)
const lib = {};
// Base dirctory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = (dir, file, data, callback) => {
  // Open the file for writing. (wx flag opens the file for writing .. there's alot of flags on the docs.)
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (err, fileDescriptor) => {
      //   fileDescriptor is a way to uniquely identify
      if (!err && fileDescriptor) {
        // convarting data to string
        const stringData = JSON.stringify(data);
        // write file.
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            // closing file.
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing file");
              }
            });
          } else {
            callback("Error writing file");
          }
        });
      } else {
        callback("Could not create now file, it may already exist");
      }
    }
  );
};
// read data inside a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};
//update data inside a file
lib.update = (dir, file, data, callback) => {
  // Open the file for riting
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);

        //truncate th file.
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            // write to the file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing the file");
                  }
                });
              } else {
                callback("Error writing to existing file");
              }
            });
          } else {
            callback("Error truncating the file");
          }
        });
      } else {
        callback("Could not open the file for updating, it may not exist yet!");
      }
    }
  );
};

//Delete a file
lib.delete = (dir, file, callback) => {
  // unlink the file
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting file");
    }
  });
};

module.exports = lib;
