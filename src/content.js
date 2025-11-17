import { generate_id } from './utils.js';
import { History, Move, Create, Edit, Delete, CreateGroup, DeleteGroup } from './history.js';


export class Content {
    #canvas;
    #history;

    #text_by_id = {};
    #groups_by_id = {};

    constructor(canvas) {
    }

    set_canvas(canvas) {
        this.#canvas = canvas;
    }

    set_history(history) {
        this.#history = history;
    }

    get_text(id) {
        return this.#text_by_id[id];
    }

    move_text(id, x, y, group_id, record = true) {
        const text = this.#text_by_id[id];
        const old_pos = {
            x: text.x,
            y: text.y,
        }
        const old_group_id = text.group_id;

        text.x = x;
        text.y = y;
        text.group_id = group_id;
        if (record) {
            this.#history.add_action(new Move(id, text.content, old_pos, { x, y }, old_group_id, group_id));
        }
    }

    move_text_update(id, x, y, group_id) {
        this.move_text(id, x, y, group_id, false);
        this.#canvas.move_textbox(id, x, y, group_id);
    }

    set_text(id, s, record = true) {
        const text = this.#text_by_id[id];
        text.content = s;
        if (record) {
            if (this.#history.is_tracking(id)) {
                if (text.record === s) {
                    return;
                }
                this.#history.add_action(new Edit(id, text.record, s));
            } else {
                this.#history.add_action(new Create(id, s));
            }
            text.record = s;
        }
    }

    set_text_update(id, s) {
        this.set_text(id, s, false);
        this.#canvas.set_textbox_text(id, s);
    }

    remove_text(id) {
        delete this.#text_by_id[id];
    }

    remove_text_update(id) {
        this.remove_text(id);
        this.#canvas.remove_textbox(id);
    }

    add_text(id, group_id, x, y) {
        const text = {
            id: id,
            group_id: group_id,
            content: "",
            record: "",
            x: x,
            y: y,
        };
        this.#text_by_id[id] = text;
    }

    add_text_update(id, group_id, x, y) {
        this.add_text(id, group_id, x, y);
    }

}