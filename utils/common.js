
const { readDirectory, readFile } = require('../utils/file');

const regex_service = /(import {? \w.*(-service|aim)')/g;
const base_url = 'D:/ELAAS/elaas/src/'

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
            if (fileList === null) {
                resolve([])
                return false
            }

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
        const path = obj.substring(obj.indexOf('\'')).replace(/\'/g, '').replace('@/', base_url)

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

            const obj = { folder: folder.toUpperCase(), service: s, path, fileName, serviceName: serviceName.join(', '), serviceNames: serviceName }

            getServiceUrl(obj)

            result.push(obj)
        })

    })
    return result
}

const getServiceVariable = (str) => str.substring(str.indexOf('const') + 6, str.indexOf('=') - 1)

const underScoreCase = (str) => str.replace(/\.?([A-Z])/g, function (x, y) { return "_" + y.toLowerCase() }).replace(/^_/, "")

const getServiceUrl = (obj) => {
    const { path, serviceNames, service } = obj
    const fileName = underScoreCase(service).replace(/_/g, '-').replace('-service', '')
    const folderName = path.substring(path.lastIndexOf('/') + 1)
    const _fileName = fileName.replace(folderName.replace('-service', '') + '-', '')

    const _path = `/api/${folderName === 'aim' ? folderName + '-service' : folderName}/${_fileName}`
    const _serviceNames = []

    serviceNames.forEach(s => {
        _serviceNames.push(_path + '/' + underScoreCase(s).replace(/_/g, '-'))
    })

    obj.serviceName = _serviceNames.join(' , ')

    return obj
}

module.exports = {
    groupBy,
    getSubImportService,
    getImportService
}