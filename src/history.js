import { TextGroup } from './canvas-textgroup.js';

class ActionGroup {
    #actions = [];

    constructor() { }

    get_length() {
        return this.#actions.length;
    }

    add_action(action) {
        this.#actions.push(action);
    }

    undo(content) {
        console.log("start undo");
        console.log(this.#actions);
        for (const action of this.#actions.toReversed()) {
            console.log("undoing");
            action.undo(content);
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
    #id;
    #text;
    #pos;
    #g_id;

    constructor(id, text, pos, g_id) {
        super();
        this.#id = id;
        this.#text = text;
        this.#pos = pos;
        this.#g_id = g_id;
    }

    get_tracking_id() {
        return this.#id;
    }

    get_description() {
        return `Deleted ${this.#text}`;
    }

    undo(content) {
        content.add_text_update(this.#id, this.#g_id, this.#pos);
        content.set_text_update(this.#id, this.#text);
    }
}

export class Move extends Action {
    #id;
    #text;
    #old_pos;
    #new_pos;
    #old_group_id;
    #new_group_id;
    constructor(id, text, old_pos, new_pos, old_group_id, new_group_id) {
        super();
        this.#id = id;
        this.#text = text;
        this.#old_pos = old_pos;
        this.#new_pos = new_pos;
        this.#old_group_id = old_group_id;
        this.#new_group_id = new_group_id;
    }

    get_tracking_id() {
        return this.#id;
    }

    get_description() {
        if (this.#old_group_id !== this.#new_group_id) {
            return `Moved ${this.#text} to group ${this.#new_group_id}`;
        }
        return `Moved ${this.#text} in group ${this.#new_group_id}`;
    }

    undo(content) {
        content.move_text_update(this.#id, this.#old_pos, this.#old_group_id);
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
        new TextGroup(canvas, { id: this.#id });
    }
}

export class Create extends Action {
    #id;
    #text;
    constructor(id, text) {
        super();
        this.#id = id;
        this.#text = text;
    }

    get_tracking_id() {
        return this.#id;
    }

    get_description() {
        return `Created ${this.#text}`;
    }

    undo(content) {
        content.remove_text_update(this.#id);
    }
}

export class Edit extends Action {
    #id;
    #old_text;
    #new_text;
    #diff;
    constructor(id, old_text, new_text, diff) {
        super();
        this.#id = id;
        this.#old_text = old_text;
        this.#new_text = new_text;
        this.#diff = diff;
    }

    get_tracking_id() {
        return this.#id;
    }

    get_description() {
        return `Replaced ${this.#old_text} with ${this.#new_text}`;
    }

    undo(content) {
        content.set_text_update(this.#id, this.#old_text);
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
        if (this.#action_groups[this.#action_groups.length - 1].get_length() === 0) {
            this.#action_groups.pop();
            return;
        }
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

    undo(content) {
        if (this.#action_groups.length === 0) {
            return;
        }
        const action = this.#action_groups.pop();
        action.undo(content);
        this.#box.firstChild.remove();
    }
}