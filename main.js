import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { setup_menu, setup_ipc } from "./src/menu.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const is_mac = process.platform === 'darwin'

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: join(__dirname, "src/preload.js"),
        },
    });
    setup_menu(win, is_mac);

    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    setup_ipc();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})

app.on('window-all-closed', () => {
    if (!is_mac) {
        app.quit();
    }
})