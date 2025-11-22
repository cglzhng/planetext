import { insert_first, merge } from './utils.js';

/*
class ActionGroup {
    #actions = [];
    #tag = null;

    constructor() { }

    get_length() {
        return this.#actions.length;
    }

    is_move() {
        return this.#actions[0] instanceof Move;
    }

    add_action(action) {
        this.#actions.push(action);
        if (action.get_tag()) {
            this.set_tag(action.get_tag());
        }
    }

    undo(content) {
        console.log("start undo");
        console.log(this.#actions);
        for (const action of this.#actions.toReversed()) {
            console.log("undoing");
            action.undo(content);
        }
    }

    set_tag(tag) {
        this.#tag = tag;
    }

    get_tag() {
        return this.#tag;
    }

    render() {
        const li = document.createElement("li");

        let s = "";
        for (const action of this.#actions) {
            s += action.render();
        }
        if (this.#tag) {
            s = this.#tag + " " + s;
        }

        const t = document.createTextNode(s);

        li.appendChild(t);
        li.classList.add("action")
        return li;

    }
}
*/

class Action {
    #time;
    constructor() {
        this.#time = Date.now();
    }

    get_time() {
        return this.#time;
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

    get_group_id() {
        return this.#g_id;
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

    get_group_id() {
        return this.#new_group_id;
    }

    get_old_group_id() {
        return this.#old_group_id;
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

export class Create extends Action {
    #id;
    #g_id;
    #text;
    constructor(id, group_id, text) {
        super();
        this.#id = id;
        this.#g_id = group_id;
        this.#text = text;
    }

    get_group_id() {
        return this.#g_id;
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
    #g_id;
    #old_text;
    #new_text;
    #diff;
    constructor(id, group_id, old_text, new_text, diff) {
        super();
        this.#id = id;
        this.#g_id = group_id;
        this.#old_text = old_text;
        this.#new_text = new_text;
        this.#diff = diff;
    }

    get_group_id() {
        return this.#g_id;
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

/*
class Snapshot {
    #action_tags = {};
    #name;

    #box;

    constructor(name) {
        this.#name = name;

        this.#box = document.createElement("div");
    }

    get_name() {
        return this.#name;
    }

    add_action(action, tag) {
        this.#actions.push(action);
    }
}
*/

export class History {
    #next_action_time = 1;
    #actions = [];
    #tracking = {};

    #action_tags = {};
    
    #snapshots = {};

    #box;
    #chrono_box;
    #tags_box;


    constructor() {
        this.#box = document.createElement("div");
        this.#box.classList.add("history");

        this.#chrono_box = document.createElement("ul");
        this.#chrono_box.classList.add("chrono");

        this.#tags_box = document.createElement("ul");
        this.#tags_box.classList.add("tags");

        this.#box.appendChild(this.#chrono_box);
        this.#box.appendChild(this.#tags_box);
    }

    get_box() {
        return this.#box;
    }

    is_tracking(id) {
        return this.#tracking[id] === true;
    }

/*
    start_action_group() {
        this.#action_groups.push(new ActionGroup());
    }

    end_action_group() {
        const last_action_group = this.#action_groups[this.#action_groups.length - 1];
        if (last_action_group.get_length() === 0) {
            this.#action_groups.pop();
            return;
        }
        if (last_action_group.is_move()) {
            retag_actions();
        }
        const node = last_action_group.render();
        if (this.#box.firstChild) {
            this.#box.insertBefore(node, this.#box.firstChild);
        } else {
            this.#box.appendChild(node);
        }

    }
*/

    show_tag(t) {
        this.#action_tags[t].box.classList.remove("hidden");
    }

    hide_tag(t) {
        this.#action_tags[t].box.classList.add("hidden");
    }

    make_tag(tag) {
        const box = document.createElement("div");

        const list_box = document.createElement("ul");
        list_box.classList.add("actions");

        this.#action_tags[tag] = {
            box,
            list_box,
            actions: [],
        };

        const title = document.createElement("h6");
        const t = document.createTextNode(tag);
        title.appendChild(t);

        box.appendChild(title);
        box.appendChild(list_box);

        box.classList.add("tag");
        this.#tags_box.appendChild(box);
    }

    regenerate(t) {
        const tag = this.#action_tags[t];
        tag.list_box.innerHTML = "";
        for (const action of tag.actions) {
            const node = this.render_action(action);
            insert_first(tag.list_box, node);
        }
    }

    add_action_to_tag(action) {
        const tag = action.get_group_id();
        this.#action_tags[tag].actions.push(action);
        const node = this.render_action(action);
        insert_first(this.#action_tags[tag].list_box, node);

        this.show_tag(action.get_group_id());
    }

    remove_action_from_tag(action) {
        const t = action.get_group_id();
        const tag = this.#action_tags[t];
        tag.list_box.removeChild(tag.list_box.firstChild);
        tag.actions.pop();

        if (tag.actions.length === 0) {
            this.hide_tag(t);
        }
    }

    move_actions(text_id, o, n) {
        const old_tag = this.#action_tags[o];
        const new_tag = this.#action_tags[n];


        const actions_to_move = old_tag.actions.filter(action => action.get_tracking_id() === text_id);
        old_tag.actions = old_tag.actions.filter(action => action.get_tracking_id() !== text_id);

        new_tag.actions = merge(actions_to_move, new_tag.actions, (x, y) => x.get_time() < y.get_time());

        this.regenerate(o);
        this.regenerate(n);

        this.show_tag(n);
        if (old_tag.actions.length === 0) {
            this.hide_tag(o);
        }
    }

    add_action(action) {
        this.#actions.push(action);
        this.#tracking[action.get_tracking_id()] = true;
        const node = this.render_action(action);
        insert_first(this.#chrono_box, node);

        if (this.#action_tags[action.get_group_id()] === undefined) {
            this.make_tag(action.get_group_id());
        }

        if (!(action instanceof Move)) {
            this.add_action_to_tag(action);
        } else {
            this.move_actions(action.get_tracking_id(), action.get_old_group_id(), action.get_group_id());
        }
    }

    render_action(action) {
        const li = document.createElement("li");

        let s = action.render();
        const t = document.createTextNode(s);

        li.appendChild(t);
        li.classList.add("action");

        return li;
    }

    undo(content) {
        if (this.#actions.length === 0) {
            return;
        }
        const action = this.#actions.pop();
        action.undo(content);
        this.#chrono_box.firstChild.remove();

        if (action instanceof Move) {
            this.move_actions(action.get_tracking_id(), action.get_group_id(), action.get_old_group_id());
        } else {
            this.remove_action_from_tag(action);
        }
    }
}