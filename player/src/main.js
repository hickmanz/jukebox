 //handle setupevents as quickly as possible
 const setupEvents = require('./setupEvents')
 if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
 }
 

const {app, BrowserWindow} = require('electron')


const path = require('path');
const url = require('url');
const fs = require('fs');

const {appUpdater} = require('./autoupdater');
const isDev = require('electron-is-dev');

let wideVineDrmDir = path.join(__dirname, './plugin/widevinecdmadapter.dll');
console.log(wideVineDrmDir)
app.commandLine.appendSwitch('widevine-cdm-path', wideVineDrmDir)
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.970')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let fileWin
let graphWin
var windowArray = [];
let mainRenderer

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 950, height: 750, frame: false, show: false, webPreferences: { plugins: true } });
  mainWindow.name = "mainWindow";  
  windowArray.push(mainWindow);
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  mainWindow.webContents.on('did-finish-load', ()=>{
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    removeWindow('mainWindow');
  })
}

function createGetFileWindow(){
  const modalPath = path.join( __dirname, './sections/get-file.html')
  fileWin = new BrowserWindow({width: 900, height: 700, frame: false, parent: mainWindow, modal: true, show: false })
  fileWin.name = "fileWin";
  windowArray.push(fileWin);
  fileWin.on('closed', function () { 
    fileWin = null;
    removeWindow('fileWin');
  })
  fileWin.webContents.on('did-finish-load', ()=>{
    fileWin.show();
    fileWin.focus();
  });
  fileWin.loadURL(modalPath)
  fileWin.show();
}


function createGraphWindow(){
  const modalPath = path.join( __dirname, './sections/graph.html')
  graphWin = new BrowserWindow({width: 900, height: 700, frame: false, show: false })
  graphWin.name = "graphWin";
  windowArray.push(graphWin);
  graphWin.on('closed', function () { 
    graphWin = null;
    removeWindow('graphWin');
  })
  graphWin.webContents.on('did-finish-load', ()=>{
    graphWin.show();
    graphWin.focus();
  });
  graphWin.setResizable(true)
  graphWin.loadURL(modalPath)
  graphWin.show();
}

function getWindow(windowName) {
  for (var i = 0; i < windowArray.length; i++) {
    if (windowArray[i].name == windowName) {
      return windowArray[i].window;
    }
  }
  return null;
}

function removeWindow(windowName){
  for (var i = 0; i < windowArray.length; i++) {
    if (windowArray[i].name == windowName) {
      windowArray.splice(i, 1);
    }
  }
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  const settings = require('electron-settings');
  createMainWindow()
  
  if (!isDev) {
    appUpdater();
  }
});
// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
      createMainWindow();

})

app.on('will-quit', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
var workDirectory;
var dataToGraph;

ipc.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile']
  }, function (files) {
	  workDirectory = files;
    if (files) event.sender.send('selected-directory', files)
  })
})
ipc.on('open-save-dialog', function (event, data) {
  dialog.showSaveDialog({ 
    defaultPath: data.name
  }, function (filename) {
    if (filename) event.sender.send('save-selected', {filename: filename, type: data.type})
  })
})
ipc.on('graph-data', function(event , data){ 
  console.log(data.dataIds) 
  dataToGraph = data.dataIds
  createGraphWindow()
});

ipc.on('open-file-window', function (event) {
  mainRenderer = event.sender;
  createGetFileWindow();
  
})

ipc.on('grapher-ready', function (event) {
  event.sender.send('data-ids', dataToGraph)
})