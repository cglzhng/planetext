let next_id = 1;

export function generate_id() {
    const id = next_id;
    next_id += 1;
    return id + "";
}