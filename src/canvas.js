import { generate_id, intersects } from './utils.js';
import { TextGroup } from './canvas-textgroup.js';
import { TextBox } from './canvas-textbox.js';

const ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const PADDING = 50;

export class Canvas {

    #content;
    #history;

    #textboxes = {};
    #textgroups = {};

    #base;
    #width;
    #height;
    #viewport_width;
    #viewport_height;
    #viewport_x = 0;
    #viewport_y = 0;
    #scale = 1;

    #padding = PADDING;

    #preview_group;
    #is_dragging = false;

    constructor(content, history, width, height) {
        this.#content = content;
        this.#history = history;
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

        this.#preview_group = new TextGroup(this, true);
        this.#preview_group.get_box().classList.add('preview-group');
    }

    debug() {
        for (const textbox of Object.values(this.#textboxes)) {
            console.log(textbox.get_position());
        }
    }

    get_base() {
        return this.#base;
    }

    get_scale() {
        return this.#scale;
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

    #get_textbox(id) {
        return this.#textboxes[id] ?? null;
    }

    #get_group(id) {
        return this.#textgroups[id] ?? null;
    }

    move_textbox(id, x, y, group_id) {
        const textbox = this.#get_textbox(id);
        textbox.move(x, y);
        this.move_textbox_to_group(id, group_id);
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

    get_padding() {
        return this.#padding;
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

    find_overlapping_group(textbox) {
        const [x, y] = textbox.get_position();
        const [width, height] = textbox.get_size();
        for (const gid of Object.keys(this.#textgroups)) {
            if (gid === this.#preview_group.get_id()) {
                continue;
            }
            const g = this.#get_group(gid);
            const [g_x, g_y, g_width, g_height] = g.get_size();
            if (intersects(
                [x - this.#padding, y - this.#padding, width + 2 * this.#padding, height + 2 * this.#padding],
                [g_x, g_y, g_width, g_height]
            )) {
                return g;
            }
        }
        return null;
    }

    set_textbox_text(id, text) {
        this.#get_textbox(id).set_text(text);
    }

    move_textbox_to_group(id, g_id) {
        const textbox = this.#get_textbox(id);
        const prev_gid = textbox.get_group_id();
        if (prev_gid === g_id) {
            if (g_id !== null) {
                const group = this.#get_group(g_id);
                group.update_size();
            }
            return;
        }
        if (prev_gid !== null) {
            const prev_group = this.#get_group(prev_gid);
            prev_group.remove_textbox(id);
        }
        if (g_id === null) {
            textbox.set_group_id(null);
            return;
        }
        const group = this.#get_group(g_id);
        textbox.set_group_id(g_id);
        group.add_textbox(textbox);
    }

    remove_textbox(id) {
        const textbox = this.#get_textbox(id);
        delete this.#textboxes[id];

        const group = this.#get_group(textbox.get_group_id());
        if (group) {
            group.remove_textbox(id);
            group.update_size();
        }

        // Must be called at the end so that blur is the last thing that happens
        textbox.delete();
    }

    remove_textbox_update(id) {
        this.remove_textbox(id);
        this.#content.remove_text(id);
    }

    get_group(id) {
        return this.#textgroups[id];
    }

    remove_group(id) {
        this.#get_group(id).delete();
        delete this.#textgroups[id];
    }

    create_group() {
        const group = new TextGroup(this);
        const id = group.get_id();
        this.#textgroups[id] = group;
        return group;
    }

    add_textbox(textbox) {
        const id = textbox.get_id();
        this.#textboxes[id] = textbox;
    }

    add_textbox_update(textbox) {
        this.add_textbox(textbox);
        const [x, y] = textbox.get_position();
        this.#content.add_text(id, textbox.get_group_id(), x, y, textbox.get_text());
    }

    recreate_preview_group(group, textbox) {
        this.empty_preview_group();
        if (group !== null) {
            for (const [id, t] of Object.entries(group.get_textboxes())) {
                this.#preview_group.add_textbox(t);
            }
        }
        this.#preview_group.add_textbox(textbox);
    }

    empty_preview_group() {
        this.#preview_group.clear();
    }

    create_textbox(x, y, g_id = null) {
        if (g_id === null) {
            const group = this.create_group();
            g_id = group.get_id()
        }
        const textbox = new TextBox(this, x, y);
        const id = textbox.get_id();

        this.move_textbox_to_group(id, g_id);

        textbox.on_move = () => { };

        textbox.on_focus = this.handle_textbox_focus.bind(this);
        textbox.on_blur = this.handle_textbox_blur.bind(this, id);
        textbox.on_change = this.handle_textbox_change.bind(this, id);
        textbox.on_drag_start = this.handle_textbox_mousedown.bind(this, id);

        this.#content.add_text_update(id, g_id, x, y);
        textbox.focus();
    }

    handle_textbox_focus() {
        this.#is_dragging = true;
    }

    handle_textbox_blur(id) {
        const textbox = this.#get_textbox(id);

        // Blur occurs when a textbox is deleted, so check for that
        if (textbox === null) {
            return;
        }

        const g_id = textbox.get_group_id();
        const group = g_id && this.#get_group(g_id);
        if (textbox.is_empty()) {
            this.remove_textbox(id);
            group?.remove_textbox(id);
            this.#is_dragging = false;
        } else {
            this.#history.start_action_group();
            this.#content.set_text(id, textbox.get_text());
            this.#history.end_action_group();
        }
    }

    handle_textbox_change(id) {
        const textbox = this.#get_textbox(id);
        this.#content.set_text(id, textbox.get_text(), false);
        if (textbox.get_group_id() === null) {
            const group = this.create_group();
            this.move_textbox_to_group(textbox.get_id(), group.get_id());
        }
        this.#get_group(textbox.get_group_id()).update_size();
    }

    handle_textbox_mousedown(id, e) {
        e.preventDefault();
        const textbox = this.#get_textbox(id);
        if (textbox.is_empty()) {
            return;
        }

        let last_x = e.clientX;
        let last_y = e.clientY;

        const prev_gid = textbox.get_group_id();
        const prev_group = prev_gid && this.#get_group(prev_gid);
        this.move_textbox_to_group(id, null);
        let last_preview_group = null;
        if (prev_group?.get_count() > 0) {
            last_preview_group = prev_group;
        }
        this.recreate_preview_group(last_preview_group, textbox);

        document.body.style.cursor = 'grabbing';

        this.#is_dragging = true;

        const drag = (e) => {
            e.preventDefault();

            this.#history.start_action_group();
            this.#content.set_text(id, textbox.get_text());
            this.#history.end_action_group();

            const dx = (e.clientX - last_x) / this.#scale;
            const dy = (e.clientY - last_y) / this.#scale;
            textbox.move_by(dx, dy);
            last_x = e.clientX;
            last_y = e.clientY;
            const overlapping_group = this.find_overlapping_group(textbox);
            if (overlapping_group !== last_preview_group) {
                this.recreate_preview_group(overlapping_group, textbox);
                last_preview_group = overlapping_group;
            } else {
                this.#preview_group.update_size();
            }
        }

        const stop = (e) => {
            base.removeEventListener('mousemove', drag);
            base.removeEventListener('mouseleave', stop);
            base.removeEventListener('mouseup', stop);

            this.#history.start_action_group();

            this.empty_preview_group();
            if (last_preview_group === null) {
                if (prev_group?.get_count() === 0) {
                    this.move_textbox_to_group(id, prev_gid);
                }
                else {
                    const new_group = this.create_group();
                    this.move_textbox_to_group(id, new_group.get_id());

                }
            } else {
                this.move_textbox_to_group(id, last_preview_group.get_id());
            }

            textbox.focus();
            const [x, y] = textbox.get_position();
            this.#content.move_text(textbox.get_id(), x, y, textbox.get_group_id());

            this.#history.end_action_group();
            e.stopPropagation();
            document.body.style.cursor = 'default';
        }

        base.addEventListener('mousemove', drag);
        base.addEventListener('mouseleave', stop);
        base.addEventListener('mouseup', stop);
    }



}