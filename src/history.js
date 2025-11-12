import { TextGroup } from './canvas.js';

class ActionGroup {
    #actions = [];

    constructor() { }

    add_action(action) {
        this.#actions.push(action);
    }

    undo(canvas) {
        for (const action of this.#actions.toReversed()) {
            console.log("undoing");
            action.undo(canvas);
        }
    }

    render() {
        const li = document.createElement("li");

        let s = "";
        for (const action of this.#actions) {
            s += action.render();
        }
        const t = document.createTextNode(s);

        li.appendChild(t);
        li.classList.add("action")
        return li;

    }
}

class Action {
    constructor() {

    }

    render() {
        return this.get_description();
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

    undo() {

    }
}

export class Move extends Action {
    #textbox;
    #text;
    #old_pos;
    #new_pos;
    #old_group_id;
    #new_group_id;
    constructor(textbox, text, old_pos, new_pos, old_group_id, new_group_id) {
        super();
        this.#textbox = textbox;
        this.#text = text;
        this.#old_pos = old_pos;
        this.#new_pos = new_pos;
        this.#old_group_id = old_group_id;
        this.#new_group_id = new_group_id;
    }

    get_tracking_id() {
        return this.#textbox.get_id();
    }

    get_description() {
        if (this.#old_group_id !== this.#new_group_id) {
            return `Moved ${this.#text} to group ${this.#new_group_id}`;
        }
        return `Moved ${this.#text} in group ${this.#new_group_id}`;
    }

    undo(canvas) {
        this.#textbox.move(this.#old_pos.x, this.#old_pos.y);
        if (this.#old_group_id !== this.#new_group_id) {
            this.#textbox.set_group(canvas.get_group(this.#old_group_id));
        }
        canvas.debug();
    }
}

export class CreateGroup extends Action {
    #group;

    constructor(group) {
        super();
        this.#group = group;
    }

    get_description() {
        return `Create group ${this.#group.get_id()}`;
    }

    get_tracking_id() {
        return this.#group.get_id();
    }

    undo(canvas) {
        this.#group.delete();
    }
}

export class DeleteGroup extends Action {
    #id;

    constructor(id) {
        super();
        this.#id = id;
    }

    get_description() {
        return `Delete group ${this.#id}`;
    }

    get_tracking_id() {
        return this.#id;
    }

    undo(canvas) {
        console.log("creating group " + this.#id);
        new TextGroup(canvas, { id: this.#id });
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
        return `Created ${this.#text}`;
    }

    undo() {

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

    undo() {

    }
}


export class History {
    #action_groups = [];
    #tracking = {};

    #box;


    constructor() {
        this.#box = document.createElement("ul");
    }

    get_box() {
        return this.#box;
    }

    is_tracking(id) {
        return this.#tracking[id] === true;
    }

    start_action_group() {
        this.#action_groups.push(new ActionGroup());
    }

    end_action_group() {
        const node = this.#action_groups[this.#action_groups.length - 1].render();
        if (this.#box.firstChild) {
            this.#box.insertBefore(node, this.#box.firstChild);
        } else {
            this.#box.appendChild(node);
        }

    }

    add_action(action) {
        this.#action_groups[this.#action_groups.length - 1].add_action(action);
        this.#tracking[action.get_tracking_id()] = true;
    }

    render_last_action() {
    }

    undo(canvas) {
        if (this.#action_groups.length === 0) {
            return;
        }
        const action = this.#action_groups.pop();
        action.undo(canvas);
        this.#box.firstChild.remove();
    }
}