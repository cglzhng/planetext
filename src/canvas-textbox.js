import { generate_id } from './utils.js';

export class TextBox {
    #id;

    #group_id = null;
    #canvas;

    #inner;
    #box;
    #x = 0;
    #y = 0;

    on_move;
    on_focus;
    on_blur;
    on_change;
    on_drag_start;

    constructor(canvas, x, y) {
        this.#canvas = canvas;
        this.#id = generate_id();

        this.#inner = document.createElement('div');
        this.#inner.classList.add('text');
        this.#inner.contentEditable = 'plaintext-only';

        this.#box = document.createElement('div');
        this.#box.style.position = 'absolute';

        this.#box.appendChild(this.#inner);

        this.move(x, y);

        this.#box.focus();

        this.#inner.addEventListener('blur', this.blur_text.bind(this));
        this.#inner.addEventListener('focus', this.edit_text.bind(this));
        this.#inner.addEventListener('input', this.input_text.bind(this));

        this.#box.addEventListener('mousedown', this.start_drag.bind(this));
        this.#inner.addEventListener('mousedown', (e) => { e.stopPropagation(); });

        this.#canvas.get_base().appendChild(this.#box);
        this.#canvas.add_textbox(this);
    }

    get_id() {
        return this.#id;
    }

    set_group_id(g_id) {
        this.#group_id = g_id;
    }

    get_group_id() {
        return this.#group_id;
    }

    get_box() {
        return this.#box;
    }

    get_text() {
        return this.#inner.innerText;
    }

    is_empty() {
        return this.get_text().trim() === "";
    }

    get_position() {
        return [this.#x, this.#y];
    }

    get_size() {
        const scale = this.#canvas.get_scale();
        const rect = this.#box.getBoundingClientRect();
        return [rect.width / scale, rect.height / scale];
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

    set_text(text) {
        this.#inner.innerText = text;
    }

    blur_text() {
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

    delete() {
        this.#box.remove();
    }
}
