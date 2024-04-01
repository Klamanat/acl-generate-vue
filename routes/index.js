var express = require('express');
var router = express.Router();
const { readDirectory, readFile } = require('../utils/file')
const { getImportService, getSubImportService, groupBy, removeDuplicates } = require('../utils/common');
const xl = require('excel4node');

const directoryPath = 'D:/ELAAS/elaas/src/views/app/expense';

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
        const _directory = directoryPath + '/' + file;
        getSubImportService(file, _directory).then(result => {
          data.push(...result)
        })
      }
    });

    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Sheet 1');
    //เราสามารถสร้างได้หลาย worksheet โดยการใช้คำสั่ง addWorksheet

    setTimeout(() => {
      const obj = groupBy(data, 'folder')
      let index = 1;

      for (const key in obj) {
        const list = obj[key]
        let serviceGroup = [];

        list.forEach(item => {
          const listService = item.url.split(', ')

          listService.forEach(url => {
            if (!serviceGroup.includes(url)) {
              ws.cell(index, 1).string(key);
              ws.cell(index, 2).string(url);

              index++
            }
          })

          serviceGroup = [...serviceGroup, ...listService]
        })
      }
      wb.write('myfirstexcel.xlsx');
      // console.log(removeDuplicates(data))
      res.render('index', { title: 'ACL Generate', data: groupBy(data, 'folder') })
    }, 10000)
  })
});

module.exports = router;
