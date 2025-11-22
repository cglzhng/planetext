import { generate_id } from './utils.js';
import { History, Move, Create, Edit, Delete } from './history.js';


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

    move_text(id, pos, group_id, record = true) {
        const text = this.#text_by_id[id];
        const old_pos = {x: text.position.x, y: text.position.y };
        const old_group_id = text.group_id;

        text.position = pos;
        text.group_id = group_id;
        if (record) {
            this.#history.add_action(new Move(id, text.content, old_pos, pos, old_group_id, group_id));
        }
    }

    move_text_update(id, pos, group_id) {
        this.move_text(id, pos, group_id, false);
        this.#canvas.move_textbox(id, pos.x, pos.y, group_id);
    }

    set_text(id, s, record = true) {
        const text = this.#text_by_id[id];
        text.content = s;
        if (record) {
            if (this.#history.is_tracking(id)) {
                if (text.record === s) {
                    return;
                }
                this.#history.add_action(new Edit(id, text.group_id, text.record, s));
            } else {
                this.#history.add_action(new Create(id, text.group_id, s));
            }
            text.record = s;
        }
    }

    set_text_update(id, s) {
        this.set_text(id, s, false);
        this.#canvas.set_textbox_text(id, s);
    }

    remove_text(id, record = true) {
        const text = this.#text_by_id[id];
        if (record) {
            this.#history.add_action(new Delete(id, text.record, text.position, text.group_id));
        }
        delete this.#text_by_id[id];
    }

    remove_text_update(id) {
        this.remove_text(id, false);
        this.#canvas.remove_textbox(id);
    }

    add_text(id, group_id, pos) {
        const text = {
            id: id,
            group_id: group_id,
            content: "",
            record: "",
            position: pos,
        };
        this.#text_by_id[id] = text;
    }

    add_text_update(id, group_id, pos) {
        this.add_text(id, group_id, pos);
        this.#canvas.create_textbox(pos.x, pos.y, group_id, id);
    }

    to_JSON() {
        const res = {};
        res.data = this.#text_by_id;
        return JSON.stringify(res);
    }

}