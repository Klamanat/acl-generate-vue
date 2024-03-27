var express = require('express');
var router = express.Router();
const fs = require('fs');

const directoryPath = 'D:/ELAAS/elaas/src/views/common/account'

const regex_service = /(import {? \w.*-service')/g

/* GET home page. */
router.get('/', async function (req, res, next) {
  readDirectory(directoryPath).then((fileList) => {
    getImportService(fileList).then((data) => {
      console.log('data: ', groupBy(data, 'fileName'))
      res.render('index', { title: 'ACL Generate', data: groupBy(data, 'fileName') })
    })
  })
});

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

// get service object.
const getImportService = (fileList, directory = directoryPath) => {
  let content = []
  return new Promise((resolve, reject) => {
    let index = 1
    fileList.forEach((file) => {
      // find program component only.
      if (file.indexOf('component.vue') !== -1) {
        readFile(directory + '/' + file).then((result) => {
          const match = result.match(regex_service)

          if (match && match.length > 0) {
            // convert to object and groupBy fileName.
            content = [...content, ...convertServiceToObject(match, file, result)]

            if (index === fileList.length - 1)
              resolve(content)

            index++
          }
        })
      } else {
        // find in folder.
        if (file.indexOf('.vue') === -1) {
          const _directory = directory + '/' + file
          // console.log('directory: ', _directory)
          readDirectory(_directory).then((fileList) => {
            getImportService(fileList, _directory).then((data) => {
              content = [...content, ...data]

              resolve(content)
            })
          })
        }
      }
    });

  })
}

// build struct service.
const convertServiceToObject = (list, fileName, content) => {
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

      result.push({ service: s, path, fileName, serviceName: serviceName.join(', ') })
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
        console.log(err);
      }

      resolve(data)
    });
  })
}

const readDirectory = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        console.log('Error reading directory:', err);
      }

      resolve(files);
    });
  })
}

module.exports = router;
