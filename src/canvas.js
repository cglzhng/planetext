import { generate_id } from './utils.js';

const ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const PADDING = 50;

class TextGroup {
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

    constructor(canvas, can_be_empty = false) {
        this.#canvas = canvas;
        this.#id = generate_id();
        this.#can_be_empty = can_be_empty;

        this.#box = document.createElement('div');
        this.#box.classList.add('group');
        this.#box.style.position = 'absolute';

        this.#box.addEventListener('click', this.handle_click.bind(this));
        //this.#box.addEventListener('mouseenter', this.handle_mouseenter.bind(this));
        //this.#box.addEventListener('mouseout', this.handle_mouseout.bind(this));
        //this.#box.addEventListener('mousemove', this.handle_mousemove.bind(this));

        this.#canvas.get_base().appendChild(this.#box);
        this.#canvas.add_group(this);
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
        this.#textboxes[id] = textbox;
        ++this.#count;
        this.update_size();
    }

    remove_textbox(id) {
        delete this.#textboxes[id];
        --this.#count;
        if (this.#count === 0 && !this.#can_be_empty) {
            this.delete();
        } else {
            this.update_size();
        }
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

        this.#x = min_x - PADDING;
        this.#y = min_y - PADDING;
        this.#width = max_x - min_x + 2 * PADDING;
        this.#height = max_y - min_y + 2 * PADDING;

        this.display();
    }

    handle_click(e) {
        const [x, y] = this.#canvas.viewport_to_world(e.clientX, e.clientY);
        this.#canvas.create_textbox(x, y, this);
    }

    delete() {
        if (this.#count > 0) {
            for (const id of Object.keys(this.#textboxes)) {
                this.#textboxes[id].delete();
            }
        }
        this.#box.remove();
        this.#canvas.remove_group(this.#id);
    }
}

class TextBox {
    #id;

    #group = null;
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

    constructor(canvas, x, y, group) {
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

        this.#inner.addEventListener('blur', this.set_text.bind(this));
        this.#inner.addEventListener('focus', this.edit_text.bind(this));
        this.#inner.addEventListener('input', this.input_text.bind(this));

        this.#box.addEventListener('mousedown', this.start_drag.bind(this));
        this.#inner.addEventListener('mousedown', (e) => { e.stopPropagation(); });

        this.#canvas.get_base().appendChild(this.#box);
        this.set_group(group);
        this.#canvas.add_textbox(this);
    }

    get_id() {
        return this.#id;
    }

    set_group(group) {
        if (group === this.#group) {
            return;
        }
        if (this.#group !== null) {
            this.#group.remove_textbox(this.#id);
        }
        if (group !== null) {
            group.add_textbox(this);
        }
        this.#group = group;
    }

    get_group() {
        return this.#group;
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
        if (this.#group) {
            this.#group.update_size();
        }
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
        if (this.#group) {
            this.#group.update_size();
        }
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

    delete() {
        this.#box.remove();
        this.#group.remove_textbox(this.#id);
        this.#canvas.remove_textbox(this.#id);
    }
}


export class Canvas {

    #content;

    #text_objects = {};
    #group_objects = {};

    #base;
    #width;
    #height;
    #viewport_width;
    #viewport_height;
    #viewport_x = 0;
    #viewport_y = 0;
    #scale = 1;

    #preview_group;
    #current_group = null;
    #is_dragging = false;

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

        this.#base.addEventListener('click', this.handle_click.bind(this));
        this.#base.addEventListener('wheel', this.zoom.bind(this));
        this.#base.addEventListener('mousedown', this.start_pan.bind(this));
        this.#base.addEventListener('mousemove', this.handle_mousemove.bind(this));

        this.#preview_group = new TextGroup(this, true);
        this.#preview_group.get_box().classList.add('preview-group');
    }

    get_base() {
        return this.#base;
    }

    get_scale() {
        return this.#scale;
    }

    set_current_group(group) {
        this.#current_group = group;
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
        const [center_x, center_y] = this.viewport_to_world(e.clientX, e.clientY);
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

    handle_mousemove(e) {
        let group = null;
        const [x, y] = this.viewport_to_world(e.clientX, e.clientY);
        for (const id of Object.keys(this.#group_objects)) {
            if (id === this.#preview_group.get_id()) {
                continue;
            }
            const g = this.#group_objects[id];
            const [g_x, g_y, g_width, g_height] = g.get_size();
            if (x >= g_x && x <= g_x + g_width && y >= g_y && y <= g_y + g_height) {
                group = g;
            }
        }
        if (group !== this.#current_group) {
            this.set_current_group(group);
        }
    }

    handle_click(e) {
        if (this.#is_dragging) {
            this.#is_dragging = false;
            return;
        }
        if (e.target === this.#base) {
            const [x, y] = this.viewport_to_world(e.clientX, e.clientY);
            this.create_textbox(x, y);
        }
    }

    remove_textbox(id) {
        delete this.#text_objects[id];
        this.#content.remove_text(id);
    }

    remove_group(id) {
        delete this.#group_objects[id];
    }

    add_group(group) {
        const id = group.get_id();
        this.#group_objects[id] = group;
    }

    add_textbox(textbox) {
        const id = textbox.get_id();
        this.#text_objects[id] = textbox;
        const [x, y] = textbox.get_position();
        this.#content.add_text(id, textbox.get_group().get_id(), x, y, textbox.get_text());
    }

    recreate_preview_group(textbox) {
        this.empty_preview_group();
        if (this.#current_group === null) {
            this.#preview_group.add_textbox(textbox);
        }
        else {
            for (const [id, t] of Object.entries(this.#current_group.get_textboxes())) {
                this.#preview_group.add_textbox(t);
            }
            this.#preview_group.add_textbox(textbox);
        }
    }

    empty_preview_group() {
        for (const id of Object.keys(this.#preview_group.get_textboxes())) {
            this.#preview_group.remove_textbox(id);
        }
        this.#preview_group.update_size();
    }

    create_textbox(x, y, group = null) {
        if (group === null) {
            group = new TextGroup(this);
        }
        const textbox = new TextBox(this, x, y, group);

        textbox.on_move = (new_x, new_y) => {
        };

        textbox.on_focus = () => {
            this.#is_dragging = true;
        }

        textbox.on_blur = () => {
            if (textbox.get_text() === "" || textbox.get_text() === "\n") {
                textbox.delete();
                this.#is_dragging = false;
            }
            else {
                this.#content.set_text(textbox.get_id(), textbox.get_text());
            }
        };

        textbox.on_change = () => {
            this.#content.set_text(textbox.get_id(), textbox.get_text());
        }

        textbox.on_drag_start = (e) => {
            e.preventDefault();
            let last_x = e.clientX;
            let last_y = e.clientY;
            textbox.set_group(null);
            let last_preview_group = this.#current_group;
            this.recreate_preview_group(textbox);
            document.body.style.cursor = 'grabbing';

            this.#is_dragging = true;

            const drag = (e) => {
                e.preventDefault();
                const dx = (e.clientX - last_x) / this.#scale;
                const dy = (e.clientY - last_y) / this.#scale;
                textbox.move_by(dx, dy);
                last_x = e.clientX;
                last_y = e.clientY;
                if (this.#current_group !== last_preview_group) {
                    this.recreate_preview_group(textbox);
                    last_preview_group = this.#current_group;
                } else {
                    this.#preview_group.update_size();
                }
            }

            const stop = (e) => {
                base.removeEventListener('mousemove', drag);
                base.removeEventListener('mouseleave', stop);
                base.removeEventListener('mouseup', stop);
                textbox.set_group(this.#current_group);
                this.empty_preview_group();
                if (textbox.get_group() === null) {
                    const new_group = new TextGroup(this);
                    textbox.set_group(new_group);
                }
                textbox.focus();
                const [x, y] = textbox.get_position();
                this.#content.move_text(textbox.get_id(), x, y, textbox.get_group().get_id());
                e.stopPropagation();
                document.body.style.cursor = 'default';
            }

            base.addEventListener('mousemove', drag);
            base.addEventListener('mouseleave', stop);
            base.addEventListener('mouseup', stop);
        }

        textbox.focus();
        group.update_size();

    }


}