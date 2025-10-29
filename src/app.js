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
    container = document.getElementById('base-container');
    sidebar = document.getElementById('sidebar-container');

    base = canvas.get_base();
    base.id = 'base';
    base.classList.add('base');

    container.appendChild(base);
    canvas.set_viewport(container.clientWidth, container.clientHeight);
    canvas.center_viewport();

    const history_box = history.get_box();
    history_box.classList.add('history');
    sidebar.appendChild(history_box);
}