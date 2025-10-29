import { generate_id } from './utils.js';


export class Content {
    #text_by_id = {}
    constructor() {
    }

    move_text(id, x, y) {
        const text = this.#text_by_id[id];
        text.x = x;
        text.y = y;
    }

    get_text(id) {
        return this.#text_by_id[id];
    }

    set_text(id, s) {
        const text = this.#text_by_id[id];
        text.content = s;
        console.log(this.#text_by_id)
    }

    remove_text(id) {
        delete this.#text_by_id[id];
    }

    add_text(id, x, y, s="") {
        const text = {
            id: id,
            content: s,
            x: x,
            y: y,
        };
        this.#text_by_id[id] = text;
    }

}