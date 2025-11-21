const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
    save: (data) => ipcRenderer.invoke("save", data),
    on_request_save: (callback) => ipcRenderer.on("request-save", (_event, value) => callback(value)),
});