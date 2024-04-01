
const { readDirectory, readFile } = require('../utils/file');

const regex_service = /import {? \w.*(-(service|report|master|support)|\.service|aim|budget|common|receive|provider)'/g;
const regex_component = /from '((.|@\/)+vue)'/g;
const base_url = 'D:/ELAAS/elaas/src/'

const groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const filterUrl = (content) => content.filter(f => f.url)

const getSubImportService = (folder, directory) => {
    let content = []

    return new Promise((resolve) => {
        readDirectory(directory).then((fileList) => {
            if (fileList === null) {
                resolve([])
                return false
            }

            fileList.forEach((file, index) => {
                if (file === 'IndexView.vue') {
                    readFile(directory + '/' + file).then((result) => {
                        const regexFile = /(componentName|dropdownComponentName): '(.*?)'/g
                        const regexPath = /(componentPath|dropdownComponentPath): '(.*?)'/g

                        const matchFiles = result.match(regexFile)
                        const matchPaths = result.match(regexPath)

                        if (!matchFiles) {
                            getImportService(file, directory, folder).then(result1 => {
                                content = [...content, ...result1]

                                resolve(filterUrl(content))
                            })
                        } else {
                            matchFiles.forEach((mf, index1) => {
                                const mFile = (mf || '').replace(/(componentName|dropdownComponentName):/g, '').replace(/\'/g, '').replace(/,/g, '').replace(' ', '')
                                const mPath = (matchPaths[index1] || '').replace(/(componentPath|dropdownComponentPath):/g, '').replace(/\'/g, '').replace(/,/g, '').replace(' ', '')
                                const directoryView = base_url + 'views/' + mPath;
                                const _mFile = mFile + '.vue';

                                getImportService(_mFile, directoryView, folder).then(result => {
                                    content = removeDuplicates([...content, ...result]);

                                    readFile(directoryView + '/' + _mFile).then((result1) => {
                                        const matchComponent = result1 ? result1.match(regex_component) : null;

                                        if (matchComponent) {
                                            matchComponent.forEach((mComponent, index2) => {
                                                let pathComponent = mComponent.substring(mComponent.indexOf('\''), mComponent.lastIndexOf('\'')).replace('\'', '').replace('./', '/')
                                                const componentFile = pathComponent.substring(pathComponent.lastIndexOf('/') + 1)

                                                if (pathComponent.match(/@/)) {
                                                    pathComponent = pathComponent.replace('@/', base_url)
                                                } else {
                                                    pathComponent = directory + '/' + pathComponent
                                                }

                                                pathComponent = pathComponent.substring(0, pathComponent.lastIndexOf('/'))

                                                // read from component level1.
                                                getImportService(componentFile, pathComponent, folder).then(result2 => {
                                                    content = removeDuplicates([...content, ...result2]);

                                                    if (index2 === matchComponent.length - 1) {
                                                        readFile(pathComponent + '/' + componentFile).then((result3) => {
                                                            const matchComponent1 = result3 ? result3.match(regex_component) : null;

                                                            if (matchComponent1) {
                                                                matchComponent1.forEach((mComponent1, index3) => {
                                                                    let pathComponent1 = mComponent1.substring(mComponent1.indexOf('\''), mComponent1.lastIndexOf('\'')).replace('\'', '').replace('./', '/')
                                                                    const componentFile1 = pathComponent1.substring(pathComponent1.lastIndexOf('/') + 1)

                                                                    if (pathComponent1.match(/@/)) {
                                                                        pathComponent1 = pathComponent1.replace('@/', base_url)
                                                                    } else {
                                                                        pathComponent1 = directory + '/' + pathComponent1
                                                                    }

                                                                    pathComponent1 = pathComponent1.substring(0, pathComponent1.lastIndexOf('/'))

                                                                    // read from component level2.
                                                                    getImportService(componentFile1, pathComponent1, folder).then(result4 => {
                                                                        content = removeDuplicates([...content, ...result4]);

                                                                        if (index3 === matchComponent1.length - 1) {
                                                                            // read from IndexView.vue
                                                                            getImportService(file, directory, folder).then(result5 => {
                                                                                content = [...content, ...result5]

                                                                                resolve(filterUrl(content))
                                                                            })
                                                                        }
                                                                    })
                                                                })
                                                            } else {
                                                                // read from IndexView.vue
                                                                getImportService(file, directory, folder).then(result4 => {
                                                                    content = removeDuplicates([...content, ...result4]);

                                                                    if (index1 === matchFiles.length - 1) {
                                                                        resolve(filterUrl(content))
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            })
                                        } else {
                                            // read from IndexView.vue
                                            getImportService(file, directory, folder).then(result3 => {
                                                content = removeDuplicates([...content, ...result3]);

                                                if (index1 === matchFiles.length - 1) {
                                                    resolve(filterUrl(content))
                                                }
                                            })
                                        }
                                    })
                                })
                            })
                        }

                    })
                } else if (file.indexOf('.vue') !== -1) {
                    getImportService(file, directory, folder).then(c => {
                        content = [...content, ...c]

                        if (index === fileList.length - 1)
                            resolve(filterUrl(content))
                    })
                } else if (file.indexOf('.vue') === -1) {
                    // find in folder.
                    const _directory = directory + '/' + file
                    getSubImportService_1(folder, _directory).then(c => {
                        content = [...content, ...c]

                        resolve(filterUrl(content))
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
                if (file.indexOf('.vue') !== -1) {
                    getImportService(file, directory, folder).then(c => {
                        content = [...content, ...c]

                        if (index === fileList.length - 1)
                            resolve(filterUrl(content))
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
            let match = result ? result.match(regex_service) : null;

            if (match && match.length > 0) {
                match = match.filter(f => f.indexOf('DateService') === -1)
                match.forEach((m, index) => {
                    setTimeout(() => {
                        // convert to object and groupBy fileName.
                        convertServiceToObject(m, file, result, folder).then(list => {
                            content = [...content, ...list];

                            if (index === match.length - 1)
                                resolve(filterUrl(content))
                        })
                    }, 500)
                })
            } else {
                resolve(filterUrl(content))
            }
        })
    })
}

// build struct service.
const convertServiceToObject = (matchConvert, fileName, content, folder) => {
    let result = [];

    return new Promise((resolve) => {
        // list.forEach((obj, index) => {
        const service = matchConvert.substring(matchConvert.indexOf('{') + 1, matchConvert.indexOf('}'))
        const path = matchConvert.substring(matchConvert.indexOf('\'')).replace(/\'/g, '').replace('@/', base_url)

        // serviceList.forEach(service => {
        let serviceName = []
        const s = service.replace(/ /g, '')
        const regex = new RegExp('const \\w+ = new ' + s, 'g')
        const match = content.match(regex)

        if (match && match.length > 0) {
            const sName = getServiceVariable(match[0]).replace(/ /g, '')
            const regex1 = new RegExp('(' + sName + '.\\w+)', 'g')
            const regexRm = new RegExp(sName + '.', 'g')
            const match1 = content.match(regex1)
            serviceName = match1 ? removeDuplicates(match1).map(m => m.replace(regexRm, '')) : [];
        }

        const objReturn = { folder: (folder || ''), service: s, path, fileName, serviceName: serviceName.join(', '), serviceNames: serviceName }

        getServiceUrl(objReturn).then((data) => {
            result.push({ folder: data.folder, url: data.serviceName, fileName: data.fileName })

            resolve(result)
            // if (index === list.length - 1) {
            // }
        })
        // })

        // })
    })
}

const removeDuplicates = (arr) => {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}

const getServiceVariable = (str) => str.substring(str.indexOf('const') + 6, str.indexOf('=') - 1)

const underScoreCase = (str) => str.replace(/\.?([A-Z])/g, function (x, y) { return "_" + y.toLowerCase() }).replace(/^_/, "")

const getServiceUrl = (obj) => {
    return new Promise((resolve) => {
        const { path, serviceNames, service } = obj
        const fileName = underScoreCase(service).replace(/_/g, '-').replace('-service', '')
        let folderName = path.substring(path.lastIndexOf('/') + 1)

        if (path.indexOf('.service') !== -1) {
            const list = path.split('/')
            list.pop()
            obj.path = list.join('/')
            folderName = list[list.length - 1]
        }

        const _fileName = fileName.replace(folderName.replace('-service', '') + '-', '')
        const _path = `/api/${folderName === 'aim' ? folderName + '-service' : folderName}/${_fileName}`
        const _serviceNames = [];


        readFile((obj.path + '/' + fileName.replace(folderName.replace('-service', ''), folderName)) + '.service.ts').then((result) => {

            serviceNames.forEach((s, index) => {
                const regex = new RegExp('public ' + s + '(.*\\s*.*\\s*.*`)')

                const match = result ? result.match(regex) : []

                if (match && match.length > 0) {
                    const url = match[0]
                    const urlName = url.substring(url.indexOf('/') + 1, url.lastIndexOf('`'))

                    _serviceNames.push(_path + '/' + urlName.replace(/(\?).*/g, ''))
                }

                if (index === serviceNames.length - 1) {
                    obj.serviceName = _serviceNames.join(' , ')

                    resolve(obj)
                }
            })
        })
    })
}

module.exports = {
    groupBy,
    getSubImportService,
    getImportService
}