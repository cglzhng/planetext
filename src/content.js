import { generate_id } from './utils.js';


export class Content {
    constructor() {
        this.text_by_id = {};
    }

    move_text(id, x, y) {
        const text = this.text_by_id[id];
        text.x = x;
        text.y = y;
    }

    get_text(id) {
        return this.text_by_id[id];
    }

    add_text(s, x, y) {
        const id = generate_id();
        const text = {
            id: id,
            content: s,
            x: x,
            y: y,
        };
        this.text_by_id[id] = text;
        return text;
    }

}