import { Content } from './content.js';
import { Canvas } from './canvas.js';
import { History } from './history.js';

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;

let container;
let sidebar;
let base;

const content = new Content();
const history = new History();
const canvas = new Canvas(content, history, CANVAS_WIDTH, CANVAS_HEIGHT);

window.addEventListener("load", startup);

function startup() {
    content.set_canvas(canvas);
    content.set_history(history);

    container = document.getElementById('base-container');
    sidebar = document.getElementById('sidebar-container');

    base = canvas.get_base();
    base.id = 'base';
    base.classList.add('base');

    container.appendChild(base);
    canvas.set_viewport(container.clientWidth, container.clientHeight);
    canvas.center_viewport();

    const history_box = history.get_box();
    sidebar.appendChild(history_box);

    document.addEventListener("keyup", keybinds);

    window.ipc.on_request_save(() => {
        window.ipc.save(content.to_JSON());
    });
}

function keybinds(e) {
    if (e.ctrlKey && e.key === "u") {
        history.undo(content);
        e.preventDefault();
        e.stopPropagation();

    }
    if (e.ctrlKey && e.key === "r") {
        console.log("here");
        history.redo(content);
        e.preventDefault();
        e.stopPropagation();
    }
}

