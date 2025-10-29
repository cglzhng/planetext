import { generate_id } from './utils.js';

const ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

class TextBox {
    #id;

    #inner;
    #box;
    #x = 0;
    #y = 0;

    on_move;
    on_focus;
    on_blur;
    on_change;
    on_drag_start;

    constructor(x, y) {
        this.#id = generate_id();

        this.#inner = document.createElement('div');
        this.#inner.classList.add('text');
        this.#inner.contentEditable = 'plaintext-only';

        this.#box = document.createElement('div')
        //this.#box.classList.add('textbox');
        this.#box.style.position = 'absolute';

        this.#box.appendChild(this.#inner);

        this.move(x, y);

        this.#box.focus();

        this.#inner.addEventListener('blur', this.set_text.bind(this));
        this.#inner.addEventListener('focus', this.edit_text.bind(this));
        this.#inner.addEventListener('input', this.input_text.bind(this));

        this.#box.addEventListener('mousedown', this.start_drag.bind(this));
        this.#inner.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    }

    get_id() {
        return this.#id;
    }

    get_box() {
        return this.#box;
    }

    get_text() {
        return this.#inner.innerText;
    }

    get_position() {
        return [this.#x, this.#y];
    }

    focus() {
        this.#inner.focus();
        this.on_focus?.();
    }

    move(x, y) {
        this.#x = x;
        this.#y = y;
        this.#box.style.transform = `translate(${x}px, ${y}px)`;
        this.on_move?.(x, y);
    }

    move_by(dx, dy) {
        this.move(this.#x + dx, this.#y + dy);
    }

    edit_text() {
        this.#box.classList.add('textbox');
        this.on_focus?.();
    }

    input_text() {
        this.on_change?.(this.get_text());
    }

    set_text() {
        this.#box.classList.remove('textbox');
        this.on_blur?.();
    }

    start_drag(e) {
        if (e.button !== 0) {
            return;
        }
        e.stopPropagation();
        this.on_drag_start?.(e);
    }


}


export class Canvas {

    #content;

    #text_objects = {};

    #base;
    #width;
    #height;
    #viewport_width;
    #viewport_height;
    #viewport_x = 0;
    #viewport_y = 0;
    #scale = 1;

    #is_editing = false;

    constructor(content, width, height) {
        this.#content = content;
        this.#base = document.createElement('div');

        this.#width = width;
        this.#height = height;

        this.#viewport_width = null;
        this.#viewport_height = null;
        this.#viewport_x = 0;
        this.#viewport_y = 0;
        this.#scale = 1;

        this.#base.style.transformOrigin = 'top left';
        this.#base.style.width = `${width}px`;
        this.#base.style.height = `${height}px`;

        this.#base.addEventListener('click', this.create_textbox.bind(this));
        this.#base.addEventListener('wheel', this.zoom.bind(this));
        this.#base.addEventListener('mousedown', this.start_pan.bind(this));
    }

    get_base() {
        return this.#base;
    }

    set_viewport(width, height) {
        this.#viewport_width = width;
        this.#viewport_height = height;
    }

    center_viewport() {
        const x = (this.#width - this.#viewport_width) / 2;
        const y = (this.#height - this.#viewport_height) / 2;
        this.move_viewport(x, y);
    }

    move_viewport(x, y) {
        this.#viewport_x = x;
        this.#viewport_y = y;
        this.transform_base();
    }

    scale_base(s) {
        this.#scale = s;
        this.transform_base();
    }

    transform_base() {
        const x = -this.#viewport_x * this.#scale;
        const y = -this.#viewport_y * this.#scale;
        this.#base.style.transform = `translate(${x}px, ${y}px) scale(${this.#scale})`;
    }

    viewport_to_world(x, y) {
        const rect = this.#base.getBoundingClientRect();
        return [(x - rect.left) / this.#scale, (y - rect.top) / this.#scale];
    }

    zoom(e) {
        e.preventDefault();
        const rect = this.#base.getBoundingClientRect();
        const center_x = (e.clientX - rect.left) / this.#scale;
        const center_y = (e.clientY - rect.top) / this.#scale;
        const dx = (center_x - this.#viewport_x) * this.#scale;
        const dy = (center_y - this.#viewport_y) * this.#scale;

        let scale = this.#scale;
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

        this.move_viewport(center_x - dx / scale, center_y - dy / scale);
        this.scale_base(scale);
    }

    start_pan(e) {
        if (e.button !== 1) {
            return;
        }
        const start_x = e.clientX;
        const start_y = e.clientY;
        const start_viewport_x = this.#viewport_x;
        const start_viewport_y = this.#viewport_y;
        document.body.style.cursor = 'grabbing';

        const pan = (e) => {
            const dx = e.clientX - start_x;
            const dy = e.clientY - start_y;
            this.move_viewport(start_viewport_x - dx / this.#scale, start_viewport_y - dy / this.#scale);
        }

        const stop = () => {
            this.#base.removeEventListener('mousemove', pan);
            this.#base.removeEventListener('mouseleave', stop);
            this.#base.removeEventListener('mouseup', stop);
            document.body.style.cursor = 'default';
        }

        this.#base.addEventListener('mousemove', pan);
        this.#base.addEventListener('mouseleave', stop);
        this.#base.addEventListener('mouseup', stop);
    }


    create_textbox(e) {
        if (e.target !== this.#base) {
            return;
        }
        if (this.#is_editing) {
            this.#is_editing = false;
            return;
        }
        const [x, y] = this.viewport_to_world(e.clientX, e.clientY);

        const textbox = new TextBox(x, y);
        const box = textbox.get_box();

        const id = textbox.get_id();
        this.#text_objects[id] = textbox;
        this.#content.add_text(id, x, y, "");

        textbox.on_move = (new_x, new_y) => {
            this.#content.move_text(id, new_x, new_y);
        };

        textbox.on_focus = () => {
            this.#is_editing = true;
        }

        textbox.on_blur = () => {
            if (box.innerText === '') {
                box.remove();
                delete this.#text_objects[id];
                this.#content.remove_text(id);
                this.#is_editing = false;
            }
            else {
                this.#content.set_text(id, textbox.get_text());
            }
        };

        textbox.on_change = () => {
            this.#content.set_text(id, textbox.get_text());
        }

        textbox.on_drag_start = (e) => {
            let last_x = e.clientX;
            let last_y = e.clientY;
            document.body.style.cursor = 'grabbing';

            this.#is_editing = true;

            const drag = (e) => {
                const dx = (e.clientX - last_x) / this.#scale;
                const dy = (e.clientY - last_y) / this.#scale;
                textbox.move_by(dx, dy);
                last_x = e.clientX;
                last_y = e.clientY;
            }

            const stop = (e) => {
                base.removeEventListener('mousemove', drag);
                base.removeEventListener('mouseleave', stop);
                base.removeEventListener('mouseup', stop);
                textbox.focus();
                e.stopPropagation();
                document.body.style.cursor = 'default';
            }

            base.addEventListener('mousemove', drag);
            base.addEventListener('mouseleave', stop);
            base.addEventListener('mouseup', stop);
        }

        this.#base.appendChild(box);
        textbox.focus();

    }


}