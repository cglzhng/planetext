import { generate_id } from './utils.js';


export class Content {
    #text_by_id = {};
    #groups_by_id = {};

    constructor() {
    }

    move_text(id, x, y, group_id) {
        const text = this.#text_by_id[id];
        text.x = x;
        text.y = y;
        text.group_id = group_id;
    }

    get_text(id) {
        return this.#text_by_id[id];
    }

    set_text(id, s) {
        const text = this.#text_by_id[id];
        text.content = s;
    }

    remove_text(id) {
        delete this.#text_by_id[id];
    }

    add_text(id, group_id, x, y, s="") {
        const text = {
            id: id,
            group_id: group_id,
            content: s,
            x: x,
            y: y,
        };
        this.#text_by_id[id] = text;
    }

}