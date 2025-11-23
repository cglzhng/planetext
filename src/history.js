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

    redo(content) {
        content.remove_text_update(this.#id);
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

    redo(content) {
        content.move_text_update(this.#id, this.#new_pos, this.#new_group_id);
    }
}

export class Create extends Action {
    #id;
    #g_id;
    #text;
    #pos;
    constructor(id, group_id, text, pos) {
        super();
        this.#id = id;
        this.#g_id = group_id;
        this.#text = text;
        this.#pos = pos;
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

    redo(content) {
        content.add_text_update(this.#id, this.#g_id, this.#pos);
        content.set_text_update(this.#id, this.#text);
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

    redo(content) {
        content.set_text_update(this.#id, this.#new_text);
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

class ActionTagGroup {
    #tag;
    #history;

    #box;
    #list_box;
    #actions = [];


    constructor(history, tag) {
        this.#history = history;
        this.#tag = tag;
        this.#box = document.createElement("div");

        this.#list_box = document.createElement("ul");
        this.#list_box.classList.add("actions");

        const title = document.createElement("h6");
        const t = document.createTextNode(tag);
        title.appendChild(t);

        this.#box.appendChild(title);
        this.#box.appendChild(this.#list_box);

        this.#box.classList.add("tag");
    }

    get_box() {
        return this.#box;
    }

    show() {
        this.#box.classList.remove("hidden");
    }

    hide() {
        this.#box.classList.add("hidden");
    }

    update_visibility() {
        if (this.#actions.length === 0) {
            this.hide();
        } else {
            this.show();
        }
    }

    add_action(action) {
        this.#actions.push(action);
        const node = this.#history.render_action(action);
        insert_first(this.#list_box, node);
        this.show();
    }

    remove_action() {
        this.#list_box.removeChild(this.#list_box.firstChild);
        this.#actions.pop();

        this.update_visibility();
    }

    regenerate() {
        this.#list_box.innerHTML = "";
        for (const action of this.#actions) {
            const node = this.#history.render_action(action);
            insert_first(this.#list_box, node);
        }
        this.update_visibility();
    }

    pop_actions(text_id) {
        const actions_to_move = this.#actions.filter(action => action.get_tracking_id() === text_id);
        this.#actions = this.#actions.filter(action => action.get_tracking_id() !== text_id);

        this.regenerate();

        return actions_to_move;

    }

    merge_actions(actions) {
        this.#actions = merge(actions, this.#actions, (x, y) => x.get_time() < y.get_time());
        this.regenerate();
    }
}

export class History {
    #next_action_time = 1;
    #action_pointer = -1;
    #actions = [];
    #tracking = {};

    #action_tag_groups = {};

    #snapshots = {};

    #chrono_list = [];
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

    highlight_current_action() {
        if (this.#action_pointer === -1) {
            return;
        }
        this.#chrono_list[this.#action_pointer].classList.add("highlighted");
    }

    unhighlight_action(i) {
        if (i === -1) {
            return;
        }
        this.#chrono_list[i].classList.remove("highlighted");
    }

    make_tag_group(tag) {
        const action_tag_group = new ActionTagGroup(this, tag);
        this.#action_tag_groups[tag] = action_tag_group;
        this.#tags_box.appendChild(action_tag_group.get_box());
    }

    add_action_to_tag(action) {
        this.#action_tag_groups[action.get_group_id()].add_action(action);
    }

    remove_action_from_tag(action) {
    }

    move_actions(text_id, o, n) {
        const old_tag = this.#action_tag_groups[o];
        const new_tag = this.#action_tag_groups[n];

        const actions_to_move = old_tag.pop_actions(text_id);
        new_tag.merge_actions(actions_to_move);
    }

    remove_actions_after_current() {
        for (let i = this.#chrono_list.length - 1; i > this.#action_pointer; --i) {
            const action = this.#actions[i];
            if (!(action instanceof Move)) {
                const action_tag_group = this.#action_tag_groups[action.get_group_id()];
                action_tag_group.remove_action();

            }
            this.#chrono_list[i].remove();
        }

        this.#actions = this.#actions.slice(0, this.#action_pointer + 1);
        this.#chrono_list = this.#chrono_list.slice(0, this.#action_pointer + 1);
    }

    add_action(action) {
        if (this.#action_pointer < this.#actions.length - 1) {
            this.remove_actions_after_current();
        }
        this.#actions.push(action);
        this.#tracking[action.get_tracking_id()] = true;
        this.unhighlight_action(this.#action_pointer);
        ++this.#action_pointer;

        const node = this.render_action(action);
        insert_first(this.#chrono_box, node);

        this.#chrono_list.push(node);
        this.highlight_current_action();

        if (this.#action_tag_groups[action.get_group_id()] === undefined) {
            this.make_tag_group(action.get_group_id());
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
        if (this.#action_pointer === -1) {
            return;
        }
        const action = this.#actions[this.#action_pointer];
        action.undo(content);

        if (action instanceof Move) {
            this.move_actions(action.get_tracking_id(), action.get_group_id(), action.get_old_group_id());
        }

        this.unhighlight_action(this.#action_pointer);
        --this.#action_pointer;
        this.highlight_current_action();
    }

    redo(content) {
        if (this.#action_pointer === this.#actions.length - 1) {
            return;
        }
        this.unhighlight_action(this.#action_pointer);
        ++this.#action_pointer;
        this.highlight_current_action();

        const action = this.#actions[this.#action_pointer];
        action.redo(content);

        if (action instanceof Move) {
            this.move_actions(action.get_tracking_id(), action.get_old_group_id(), action.get_group_id());
        }
    }
}