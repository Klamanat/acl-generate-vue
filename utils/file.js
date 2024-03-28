const fs = require('fs');

const readFile = async (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                resolve(null);
            }

            resolve(data)
        });
    })
}

const readDirectory = async (path) => {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                resolve(null);
            }

            resolve(files);
        });
    })
}

module.exports = {
    readFile,
    readDirectory
}