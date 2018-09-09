const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
     console.error(error.message || error)
     process.exit(1)
 })

function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'release-builds')

    return Promise.resolve({
       appDirectory: appDir,
       authors: 'Zackary Hickman',
       noMsi: true,
       icon: path.join(rootPath, "src/assets/icons/win/icon.ico"),
       loadingGif: "src/assets/gif/loading.gif",
       iconUrl: "http://makeworking.zackaryhickman.com/icon.ico",
       setupIcon: path.join(rootPath, "src/assets/icons/win/icon.ico"),
       outputDirectory: path.join(outPath, 'windows-installer'),
       exe: 'Zaqotron.exe',
       setupExe: 'Zaqotron\ Setup.exe'
   })
}