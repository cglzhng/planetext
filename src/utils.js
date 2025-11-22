let next_id = 1;

export function generate_id() {
    const id = next_id;
    next_id += 1;
    return id + "";
}

// https://silentmatt.com/rectangle-intersection/
export function intersects([a_x, a_y, a_width, a_height], [b_x, b_y, b_width, b_height]) {
    return (a_x < b_x + b_width &&
        a_x + a_width > b_x &&
        a_y < b_y + b_height &&
        a_y + a_height > b_y
    );
}

export function insert_first(parent, child) {
    if (parent.firstChild) {
        parent.insertBefore(child, parent.firstChild);
    } else {
        parent.appendChild(child);
    }
}

export function merge(a, b, f) {
    const ret = [];
    const a_reversed = a.reverse();
    const b_reversed = b.reverse();
    while (a_reversed.length > 0 && b_reversed.length > 0) {
        if (f(a_reversed[a_reversed.length - 1], b_reversed[b_reversed.length - 1])) {
            ret.push(a.pop());
        } else {
            ret.push(b.pop());
        }
    }
    if (a_reversed.length > 0) {
        return ret.concat(a_reversed.reverse());
    }
    if (b_reversed.length > 0) {
        return ret.concat(b_reversed.reverse());
    }

    return ret;
}