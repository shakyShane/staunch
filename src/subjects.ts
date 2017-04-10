export function assignFn(extras, incoming) {
    return Object.assign({}, extras, incoming);
}

export function concatFn(acc, incoming) {
    return acc.concat(incoming);
}