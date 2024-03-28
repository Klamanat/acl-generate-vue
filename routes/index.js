var express = require('express');
var router = express.Router();
const { readDirectory, readFile } = require('../utils/file')
const { getImportService, getSubImportService, groupBy } = require('../utils/common');

const directoryPath = 'D:/ELAAS/elaas/src/views/app/executive';

/* GET home page. */
router.get('/', async function (req, res, next) {
  let data = []
  readDirectory(directoryPath).then((fileList) => {
    fileList.forEach((file) => {
      if (file.indexOf('.vue') !== -1) {
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

module.exports = router;
