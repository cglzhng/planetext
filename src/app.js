import { Content } from './content.js';
import { Canvas } from './canvas.js';

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;

let container;
let base;

const content = new Content();
const canvas = new Canvas(content, CANVAS_WIDTH, CANVAS_HEIGHT);

window.addEventListener("load", startup);

function startup() {
    container = document.getElementById('base-container');

    base = canvas.get_base();
    base.id = 'base';
    base.classList.add('base');

    container.appendChild(base);
    canvas.set_viewport(container.clientWidth, container.clientHeight);
    canvas.center_viewport();
}