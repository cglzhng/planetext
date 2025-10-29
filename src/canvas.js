const ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;


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

        this.#base.addEventListener('click', this.create_text.bind(this));
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

    create_text(e) {
        if (e.target !== this.#base) {
            return;
        }
        const input = document.createElement('span');
        input.classList.add('textbox');
        input.classList.add('text');
        input.contentEditable = 'true';
        input.style.position = 'absolute';
        const rect = base.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.#scale;
        const y = (e.clientY - rect.top) / this.#scale;
        input.style.transform = `translate(${x}px, ${y}px)`;

        this.#base.appendChild(input);
        input.focus();

        input.addEventListener('blur', () => this.set_text(input, x, y));
        input.addEventListener('click', this.edit_text);
    }

    edit_text(e) {
        const input = e.target;
        input.classList.add('textbox');
    }

    set_text(input, x, y) {
        if (input.innerText === '') {
            input.remove();
            return;
        }
        const text = this.#content.add_text(input.innerText, x, y);
        const id = text.id;
        input.classList.remove('textbox');
        this.#text_objects[id] = input;

        const start_drag_text = (e) => {
            if (e.button !== 0) {
                return;
            }
            const text = e.target;
            const start_x = e.clientX;
            const start_y = e.clientY;
            const text_rect = text.getBoundingClientRect();
            const base_rect = base.getBoundingClientRect();
            const text_start_x = (text_rect.left - base_rect.left) / this.#scale;
            const text_start_y = (text_rect.top - base_rect.top) / this.#scale;
            document.body.style.cursor = 'grabbing';

            const drag = (e) => {
                const dx = (e.clientX - start_x) / this.#scale;
                const dy = (e.clientY - start_y) / this.#scale;
                this.move_text(id, text_start_x + dx, text_start_y + dy);
            }

            const stop = () => {
                base.removeEventListener('mousemove', drag);
                base.removeEventListener('mouseleave', stop);
                base.removeEventListener('mouseup', stop);
                document.body.style.cursor = 'default';
            }

            base.addEventListener('mousemove', drag);
            base.addEventListener('mouseleave', stop);
            base.addEventListener('mouseup', stop);
        }

        input.addEventListener('mousedown', start_drag_text);

    }

    move_text(id, x, y) {
        this.#content.move_text(id, x, y);
        const text_object = this.#text_objects[id];
        text_object.style.transform = `translate(${x}px, ${y}px)`;
    }



}