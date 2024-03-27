var express = require('express');
var router = express.Router();
const fs = require('fs');

const directoryPath = 'D:/ELAAS/elaas/src/views/common/account'

const regex_service = /(import {? \w.*-service')/g

/* GET home page. */
router.get('/', async function (req, res, next) {
  let data = []
  readDirectory(directoryPath).then((fileList) => {
    console.log(fileList)
    fileList.forEach((file) => {
      if (file.indexOf('component.vue') !== -1) {
        // find program component only.
        getImportService(file, directoryPath).then(result => {
          data.push(...result)
        })
      } else if (file.indexOf('.vue') === -1) {
        // find in folder.
        const _directory = directoryPath + '/' + file
        getSubImportService(file, _directory).then(result => {
          data.push(...result)
        })
      }
    });

    setTimeout(() => {
      console.log(groupBy(data, 'folder'))
      res.render('index', { title: 'ACL Generate', data: groupBy(data, 'folder') })
    }, 500)
  })
});

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const getSubImportService = (folder, directory) => {
  let content = []

  return new Promise((resolve) => {
    readDirectory(directory).then((fileList) => {
      fileList.forEach((file, index) => {
        if (file.indexOf('component.vue') !== -1) {
          getImportService(file, directory, folder).then(c => {
            content = [...content, ...c]

            if (index === fileList.length - 1)
              resolve(content)
          })
        } else if (file.indexOf('.vue') === -1) {
          // find in folder.
          const _directory = directory + '/' + file
          getSubImportService_1(folder, _directory).then(c => {
            content = [...content, ...c]

            resolve(content)
          })
        }
      })
    })
  })
}

const getSubImportService_1 = (folder, directory) => {
  let content = []

  return new Promise((resolve) => {
    readDirectory(directory).then((fileList) => {
      fileList.forEach((file, index) => {
        if (file.indexOf('component.vue') !== -1) {
          getImportService(file, directory, folder).then(c => {
            content = [...content, ...c]

            if (index === fileList.length - 1)
              resolve(content)
          })
        }
      })
    })
  })
}

// get service object.
const getImportService = (file, directory = directoryPath, folder) => {
  let content = []
  return new Promise((resolve) => {
    readFile(directory + '/' + file).then((result) => {
      const match = result ? result.match(regex_service) : null

      if (match && match.length > 0) {
        // convert to object and groupBy fileName.
        content = [...content, ...convertServiceToObject(match, file, result, folder)]

        resolve(content)
      }
    })
  })
}

// build struct service.
const convertServiceToObject = (list, fileName, content, folder) => {
  let result = []
  list.forEach(obj => {
    const serviceList = obj.substring(obj.indexOf('{') + 1, obj.indexOf('}')).split(', ')
    const path = obj.substring(obj.indexOf('\'')).replace(/\'/g, '')

    serviceList.forEach(service => {
      let serviceName = []
      const s = service.replace(/ /g, '')
      const regex = new RegExp('const \\w+ = new ' + s, 'g')
      const match = content.match(regex)

      if (match && match.length > 0) {
        const sName = getServiceVariable(match[0]).replace(/ /g, '')
        const regex1 = new RegExp('(' + sName + '.\\w+)', 'g')
        const regexRm = new RegExp(sName + '.', 'g')
        const match1 = content.match(regex1)
        serviceName = match1 ? match1.map(m => m.replace(regexRm, '')) : []
      }

      result.push({ folder, service: s, path, fileName, serviceName: serviceName.join(', ') })
    })

  })
  return result
}

const getServiceVariable = (str) => str.substring(str.indexOf('const') + 6, str.indexOf('=') - 1)

const camelCase = (str) => {
  // Using replace method with regEx
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

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

module.exports = router;
