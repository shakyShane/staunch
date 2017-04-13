import Rx = require('rx');

export function createDefaultMailbox (actor) {
    const incomingMessages = new Rx.Subject();

    const outgoing = incomingMessages
        .flatMap(incomingMessage => {
            const [_, method] = incomingMessage.action.type.split('.');
            const receive = actor.receive;

            if (typeof receive !== 'function') {
                return Rx.Observable.throw(`'Actors[default] must implement a receive() method`);
            }

            return Rx.Observable.create(obs => {

                const sender = {
                    id: incomingMessage.id,
                    reply: (message) => {
                        obs.onNext(message);
                    }
                };

                receive.call(null, incomingMessage, sender);

            }).map(output => {
                return {
                    response: output,
                    respId: incomingMessage.id
                }
            });

        }).share();

    return {outgoing, incoming: incomingMessages};
}