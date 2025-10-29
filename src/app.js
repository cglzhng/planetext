const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

let base;
let container;

const state = {
    next_id: 1,
    texts: {},
    viewport_width: null,
    viewport_height: null,
    viewport_x: 0,
    viewport_y: 0,
    scale: 1,
};

window.addEventListener("load", startup);

function startup() {
    base = document.getElementById('base');
    container = document.getElementById('base-container');
    base.style.width = `${CANVAS_WIDTH}px`;
    base.style.height = `${CANVAS_HEIGHT}px`;

    set_viewport_width();
    center_viewport();

    base.addEventListener('click', create_text);
    base.addEventListener('wheel', zoom);
    base.addEventListener('mousedown', start_pan);
}

function set_viewport_width() {
    const rect = container.getBoundingClientRect();
    state.viewport_width = rect.width;
    state.viewport_height = rect.height;
}

function center_viewport() {
    const x = (CANVAS_WIDTH - state.viewport_width) / 2;
    const y = (CANVAS_HEIGHT - state.viewport_height) / 2;
    move_viewport(x, y);
}

function move_viewport(x, y) {
    state.viewport_x = x;
    state.viewport_y = y;
    transform_base();
}

function scale_base(s) {
    state.scale = s;
    transform_base();
}  

function transform_base() {
    const x = -state.viewport_x / state.scale;
    const y = -state.viewport_y / state.scale;
    base.style.transform = `scale(${state.scale}) translate(${x}px, ${y}px) `;
}

function zoom(e) {
    e.preventDefault();
    const rect = base.getBoundingClientRect();
    const center_offset_x = (e.clientX - rect.left) / state.scale - state.viewport_x;
    const center_offset_y = (e.clientY - rect.top) / state.scale - state.viewport_y;


    let scale = state.scale
    if (e.deltaY < 0) {
        scale *= ZOOM_SPEED;
    } else {
        scale /= ZOOM_SPEED;
    }
    if (scale < MIN_ZOOM) {
        scale = MIN_ZOOM;
    }
    if (scale > MAX_ZOOM) {
        scale = MAX_ZOOM;
    }

    //move_base(state.x - dx, state.y - dy);
    scale_base(scale);
}

function start_pan(e) {
    if (e.button !== 1) {
        return;
    }
    let last_x = e.clientX;
    let last_y = e.clientY;
    document.body.style.cursor = 'grabbing';

    const pan = (e) => {
        const dx = e.clientX - last_x;
        const dy = e.clientY - last_y;
        move_viewport(state.viewport_x - dx, state.viewport_y - dy);
        last_x = e.clientX;
        last_y = e.clientY;
    }

    const stop = () => {
        base.removeEventListener('mousemove', pan);
        base.removeEventListener('mouseleave', stop);
        base.removeEventListener('mouseup', stop);
        document.body.style.cursor = 'default';
    }

    base.addEventListener('mousemove', pan);
    base.addEventListener('mouseleave', stop);
    base.addEventListener('mouseup', stop);

}


function create_text(e) {
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    const rect = base.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.scale;
    const y = (e.clientY - rect.top) / state.scale;
    input.style.transform = `translate(${x}px, ${y}px)`;

    base.appendChild(input);
    input.focus();

    input.addEventListener('blur', () => set_text(input, x, y));
}

function set_text(input, x, y) {
    if (input.value === '') {
        input.remove();
        return;
    }
    const text = document.createElement('span');
    text.textContent = input.value;
    text.style.position = 'absolute';
    text.style.transform = input.style.transform;

    add_text_to_state(input.value, x, y)

    base.appendChild(text);
    input.remove();
}

function add_text_to_state(s, x, y) {
    const id = generate_id();
    const text = {
        id: id,
        content: s,
        x: x,
        y: y,
    };
    state.texts[id] = text;
}

function generate_id() {
    const id = state.next_id;
    state.next_id += 1;
    return id;
}