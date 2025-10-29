class Action {
    constructor() {

    }

    render() {
        const li = document.createElement("li");
        const t = document.createTextNode(this.get_description());
        li.appendChild(t);
        li.classList.add("action")
        return li;
    }
}

export class Delete extends Action {
    #textbox;
    #text;

    constructor(textbox, text) {
        super();
        this.#textbox = textbox;
        this.#text = text;
    }

    get_tracking_id() {
        return this.#textbox.get_id();
    }

    get_description() {
        return `Deleted ${this.#text}`;
    }
}

export class Move extends Action {
    #textbox;
    #text;
    #old_pos;
    #new_pos;
    #old_group;
    #new_group;
    constructor(textbox, text, old_pos, new_pos, old_group, new_group) {
        super();
        this.#textbox = textbox;
        this.#text = text;
        this.#old_pos = old_pos;
        this.#new_pos = new_pos;
        this.#old_group = old_group;
        this.#new_group = new_group;
    }

    get_tracking_id() {
        return this.#textbox.get_id();
    }

    get_description() {
        if (this.#old_group !== this.#new_group) {
            return `Moved ${this.#text} to group ${this.#new_group.get_id()}`;
        }
        return `Moved ${this.#text} in group ${this.#new_group.get_id()}`;
    }
}

export class Create extends Action {
    #textbox;
    #text;
    constructor(textbox, text) {
        super();
        this.#textbox = textbox;
        this.#text = text;
    }

    get_tracking_id() {
        return this.#textbox.get_id();
    }

    get_description() {
        return`Created ${this.#text}`;
    }
}

export class Edit extends Action {
    #textbox;
    #old_text;
    #new_text;
    #diff;
    constructor(textbox, old_text, new_text, diff) {
        super();
        this.#textbox = textbox;
        this.#old_text = old_text;
        this.#new_text = new_text;
        this.#diff = diff;
    }

    get_tracking_id() {
        return this.#textbox.get_id();
    }

    get_description() {
        return `Replaced ${this.#old_text} with ${this.#new_text}`;
    }
}


export class History {
    #action_list = [];
    #tracking = {};

    #box;
    #first_child = null;


    constructor() {
        this.#box = document.createElement("ul");
    }

    get_box() {
        return this.#box;
    }

    is_tracking(id) {
        return this.#tracking[id] === true;
    }

    add_action(action) {
        this.#action_list.push(action);
        this.#tracking[action.get_tracking_id()] = true;
        const action_node = action.render();
        if (this.#first_child) {
            console.log(this.#first_child);
            this.#box.insertBefore(action_node, this.#first_child);
        } else {
            this.#box.appendChild(action_node);
        }
        this.#first_child = action_node;

    }
}