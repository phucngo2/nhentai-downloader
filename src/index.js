const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const { API } = require("nhentai-api");
const api = new API();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 768,
        height: 432,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: __dirname + "/content/cat.png",
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Open dialog to get save path
    ipcMain.on("openF", function () {
        dialog
            .showOpenDialog({
                title: "Open File",
                properties: ["openDirectory"],
            })
            .then((result) => {
                mainWindow.webContents.send("filepaths", result.filePaths);
            });
    });

    // Write files
    ipcMain.on("writeFiles", async function (event, code, chosenDir) {
        // Fetch book
        api.getBook(code)
            .then(async (book) => {
                // Remove special characters
                var dir = book.title.english.replace(/\|/g, "");

                // Concat dir
                const savePath = `${chosenDir}/${dir}`;

                // Create directory
                createDir(savePath);

                // For each page => download
                for (let i = 0; i < book.pages.length; i++) {
                    var url = await api.getImageURL(book.pages[i]);
                    await downloadImg(url, savePath, `${i}`);
                }

                // Done
                mainWindow.webContents.send("done", "done");
            })
            .catch((err) => {
                mainWindow.webContents.send("error", "error");
            });
    });

    // Create directory
    function createDir(dir) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        } catch (err) {
            console.log(err);
        }
    }

    // Fetch image then write
    function downloadImg(url, dirName, imgName) {
        return axios
            .get(url, { responseType: "stream" })
            .then((response) => {
                response.data.pipe(
                    fs.createWriteStream(`${dirName}/${imgName}.jpg`)
                );
            })
            .catch((error) => {
                mainWindow.webContents.send("error", "error");
            });
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
