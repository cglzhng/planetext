import { Menu, ipcMain } from "electron";
import { save_data, open_file } from "./file.js";

export function setup_ipc() {
    ipcMain.handle("save", save_data);
}

function request_save_from_renderer(renderer) {
    renderer.webContents.send("request-save");
}

async function send_data_to_renderer(renderer) {
    const data = await open_file();
    renderer.webContents.send("open", data);
}

export function setup_menu(renderer, is_mac) {
    const template = [
        ...(is_mac
            ? [{ role: 'appMenu' }]
            : []),
        {
            label: "File",
            submenu: [

                is_mac ? { role: 'close' } : { role: 'quit' },
                {
                    label: "Save",
                    click: () => request_save_from_renderer(renderer),
                    accelerator: "CommandOrControl+S",
                },
                {
                    label: "Open",
                    click: () => send_data_to_renderer(renderer),
                }
            ]
        },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: () => {
                        console.log("clicked");
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}