const electron = require('electron');
const app = electron.app;

module.exports = {
handleSquirrelEvent: function() {
    if (process.argv.length === 1) {
    return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');
    const Registry = require('winreg');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };
    /* left over registry edit stuff
    let regFilesMain = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\*\\shell\\MakeWorking`
    });
    let regFilesSec = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\*\\shell\\MakeWorking\\command`
    });
    let regFoldersMain = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\Directory\\shell\\MakeWorking`
    });
    let regFoldersSec = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\Directory\\shell\\MakeWorking\\command`
    });  
    */
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':

            /*
            regFilesMain.create( function (err) {  
                if (err) throw err;
                regFilesMain.set(Registry.DEFAULT_VALUE, 'REG_SZ', 'Change working', function (err) {
                    if (err) throw err;    
                });
                regFilesMain.set('Icon', 'REG_SZ', process.execPath, function (err) {             
                    if (err) throw err;   
                });
            });
            regFilesSec.create( function (err) {             
                if (err) throw err;
                regFilesSec.set(Registry.DEFAULT_VALUE, 'REG_SZ', process.execPath + ' %1', function (err) { 
                    if (err) throw err; 
                });  
            });
            regFoldersMain.create( function (err) {  
                if (err) throw err;
                regFoldersMain.set(Registry.DEFAULT_VALUE, 'REG_SZ', 'Change working', function (err) {
                    if (err) throw err;    
                });
                regFoldersMain.set('Icon', 'REG_SZ', process.execPath, function (err) {             
                    if (err) throw err;   
                });
            });
            regFoldersSec.create( function (err) {             
                if (err) throw err;  
                regFoldersSec.set(Registry.DEFAULT_VALUE, 'REG_SZ', process.execPath + ' %1', function (err) { 
                    if (err) throw err; 
                });
            });
            */
            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);
            
            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            /*
            regFilesMain.destroy(function (err) {             
                if (err) throw err;  
            });
            regFoldersMain.destroy(function (err) {             
                if (err) throw err;  
            });
            */
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            app.quit();
            return true;
    }
}
}