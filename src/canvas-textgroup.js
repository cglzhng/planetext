import { generate_id } from './utils.js';

export class TextGroup {
    #id;
    #canvas;
    #can_be_empty = false;

    #box;
    #x = 0;
    #y = 0;
    #width = 0;
    #height = 0;

    #count = 0;

    #textboxes = {};

    constructor(canvas, { id = null, can_be_empty = false } = {}) {
        this.#canvas = canvas;
        if (id === null) {
            this.#id = generate_id();
        } else {
            this.#id = id;
        }
        this.#can_be_empty = can_be_empty;

        this.#box = document.createElement('div');
        this.#box.classList.add('group');
        this.#box.style.position = 'absolute';
        this.#box.style.setProperty('--group-id', `"${this.#id}"`);

        this.#box.addEventListener('click', this.handle_click.bind(this));

        this.#canvas.get_base().appendChild(this.#box);
    }

    get_id() {
        return this.#id;
    }

    get_box() {
        return this.#box;
    }

    get_count() {
        return this.#count;
    }

    get_size() {
        return [this.#x, this.#y, this.#width, this.#height];
    }

    add_textbox(textbox) {
        const id = textbox.get_id();
        if (this.#textboxes[id] !== undefined) {
            return;
        }
        this.#textboxes[id] = textbox;
        ++this.#count;
        this.update_size();
    }

    remove_textbox(id) {
        if (this.#textboxes[id] === undefined) {
            return;
        }
        delete this.#textboxes[id];
        --this.#count;
        this.update_size();
    }

    clear() {
        this.#textboxes = {};
        this.#count = 0;
        this.update_size();
    }

    get_textboxes() {
        return this.#textboxes;
    }

    display() {
        this.#box.style.transform = `translate(${this.#x}px, ${this.#y}px)`;
        this.#box.style.width = `${this.#width}px`;
        this.#box.style.height = `${this.#height}px`;
    }

    update_size() {
        if (this.#count === 0) {
            this.#x = 0;
            this.#y = 0;
            this.#width = 0;
            this.#height = 0;
            this.display();
            return;
        }

        const padding = this.#canvas.get_padding();

        let min_x = Infinity;
        let min_y = Infinity;
        let max_x = -Infinity;
        let max_y = -Infinity;

        for (const id of Object.keys(this.#textboxes)) {
            const textbox = this.#textboxes[id];
            const [x, y] = textbox.get_position();
            const [width, height] = textbox.get_size();
            if (x < min_x) {
                min_x = x;
            }
            if (y < min_y) {
                min_y = y;
            }
            if (x + width > max_x) {
                max_x = x + width;
            }
            if (y + height > max_y) {
                max_y = y + height;
            }
        }

        this.#x = min_x - padding;
        this.#y = min_y - padding;
        this.#width = max_x - min_x + 2 * padding;
        this.#height = max_y - min_y + 2 * padding;

        this.display();
    }

    handle_click(e) {
        const [x, y] = this.#canvas.viewport_to_world(e.clientX, e.clientY);
        this.#canvas.create_textbox(x, y, this.#id);
    }

    delete() {
        this.#box.remove();
    }
}
