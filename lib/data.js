const fs = require("fs");
const path = require("path");

const lib = {};

lib.basedir = path.join(__dirname, "/../.data/");

lib.create = (dir, file, data, callback) => {
  fs.open(`${lib.basedir + dir}/${file}.json`, "wx", (err, fileDescriptor) => {
    const stringData = JSON.stringify(data);
    if (!err && fileDescriptor) {
      fs.writeFile(fileDescriptor, stringData, (err2) => {
        if (!err2) {
          fs.close(fileDescriptor, (err3) => {
            if (!err3) {
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
      callback("Error opening file");
    }
  });
};

lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.basedir + dir}/${file}.json`, "utf-8", (err, data) => {
    callback(err, data);
  });
};

lib.update = (dir, file, data, callback) => {
  fs.open(`${lib.basedir + dir}/${file}.json`, "r+", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      fs.ftruncate(fileDescriptor, (err2) => {
        if (!err2) {
          const dataString = JSON.stringify(data);
          fs.writeFile(fileDescriptor, dataString, (err3) => {
            if (!err3) {
              fs.close(fileDescriptor, (err4) => {
                if (!err4) {
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
          callback("Error truncating file");
        }
      });
    } else {
      callback("Error opening file");
    }
  });
};

lib.delete = (dir, file, callback) => {
  fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting file");
    }
  });
};

lib.list = (dir, callback) => {
  fs.readdir(`${lib.basedir + dir}/`, (err, fileNames) => {
    if (!err && fileNames.length > 0) {
      const trimmedFileNames = [];
      fileNames.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback("Error reading main directory");
    }
  });
};

module.exports = lib;
