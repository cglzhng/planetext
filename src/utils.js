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