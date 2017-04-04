export function newExtrasFn(extras, incoming) {
    return Object.assign({}, extras, incoming);
}

export function concatFn(acc, incoming) {
    return acc.concat(incoming);
}