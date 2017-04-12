import Rx = require('rx');
const { empty, of } = Rx.Observable;

// A mailbox knows how to map incoming messages
// onto sync/async methods
export function createMailbox(actor) {

    const sub = new Rx.Subject();

    const outgoing = sub.flatMap(x => {
        const [_, method] = x.action.type.split('.');
        const methodMatch = actor.methods ? actor.methods[method] : null;
        const effectMatch = actor.effects ? actor.effects[method] : null;

        if (methodMatch) {
            const response = methodMatch.call(null, x.action.payload, x);
            return of({
                response,
                respId: x.id
            });
        }

        if (effectMatch) {
            return effectMatch
                .call(null, x.action.payload, x)
                .map(output => {
                    return {
                        response: output,
                        respId: x.id
                    }
                });
        }

        return empty();
    }).share();

    return {outgoing, incoming: sub};
}
