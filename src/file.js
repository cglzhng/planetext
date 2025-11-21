import { dialog } from "electron";
import fs from "node:fs/promises";

export async function save_data(event, data) {
    const file = await dialog.showSaveDialog();
    if (file.canceled || file.filePath === "") {
        return;
    }
    save_to_file(file.filePath, data);
}

function save_to_file(filename, data) {
    fs.writeFile(filename, data);
}

export async function open_file() {
    console.log("here");
    const file = await dialog.showOpenDialog();
    if (file.canceled || file.filePaths.length === 0 || file.filePaths[0] === "") {
        return;
    }
    const data = await fs.readFile(file.filePaths[0], "utf-8");
    console.log(data);
    return data;
}