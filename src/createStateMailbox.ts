import Rx = require('rx');
const { empty, of } = Rx.Observable;

// A state mailbox knows how to automatically
// map incoming messages
// onto sync/async methods
// 'methods' return values immediately
// 'effects' return more messages
export function createStateMailbox(actor) {

    const incomingMessages = new Rx.Subject();

    const outgoing = incomingMessages
        .flatMap(incomingMessage => {

            const [_, method]  = incomingMessage.action.type.split('.');
            const methodMatch  = actor.methods ? actor.methods[method] : null;
            const effectMatch  = actor.effects ? actor.effects[method] : null;
            const missingMatch = actor.missing ? actor.missing : null;
            const effect       = (effectMatch || missingMatch);

            if (methodMatch) {
                const response = methodMatch.call(null, incomingMessage.action.payload, incomingMessage);
                return of({
                    response,
                    respId: incomingMessage.id
                });
            }

            if (effect) {

                const output = effect.call(null, incomingMessage.action.payload, incomingMessage);
                if (output.subscribe) {
                    return output
                    .map(output => {
                        return {
                            response: output,
                            respId: incomingMessage.id
                        }
                    });
                } else {
                return of(output)
                    .map(output => {
                        return {
                            response: output,
                            respId: incomingMessage.id
                        }
                    });
                }
            }
        return empty();
    }).share();

    return {outgoing, incoming: incomingMessages};
}
