const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const uuid = require('uuid');

// global register of available actors
const register       = new Rx.BehaviorSubject({});
// stream for actors to register upon
const incomingActors = new Rx.Subject();
// responses stream where actors can 'reply' via an id
const responses      = new Rx.Subject();

// for incoming actors, create a mailbox for each
incomingActors
    .map(item => {
        return {
            item,
            mailbox: createMailbox(item)
        }
    })
    // send the output of this mailboxes
    // outgoing messages into the responses
    // steam
    .do(x => {
        x.mailbox.outgoing.subscribe(resp => {
            responses.onNext(resp);
        });
    })
    // Create a global register containing actors by name
    // this is for the
    .scan(function (acc, {item, mailbox}) {
        acc[item.name] = item;
        acc[item.name]['mailbox'] = mailbox;
        return acc;
    }, {})
    .subscribe(register);

// create an arbiter for handling incoming messages
const arbiter = new Rx.Subject();

// now create 1 actor for demonstration purposes
const actor = createActor();
function createActor (name, methods) {
    const state = {name: 'kittie'};
    let messages = [];
    return {
        name: 'Customer',
        methods: {
            // example 'sync' method called read
            // that will return immediately
            read: function (payload, id) {
                return 'shane is learning actor model';
            },
            ping: function (payload, message) {
                messages.push(message);
                return JSON.stringify(messages);
            }
        },
        effects: {
            // example 'async' effect that will take 5 seconds to
            // respond
            reload: function (payload, id) {
                return of('hi there').delay(5000);
            }
        }
    };
}

// A mailbox knows how to map incoming messages
// onto sync/async methods
function createMailbox(actor) {

    const sub = new Rx.Subject();

    const outgoing = sub.flatMap(x => {
        const [_, method] = x.action.type.split('.');
        const methodMatch = actor.methods[method];
        const effectMatch = actor.effects[method];

        if (methodMatch) {
            const response = methodMatch.call(null, x.action.payload, x);
            return of({
                response,
                respId: x.id
            });
        }

        if (effectMatch) {
            return effectMatch
                .call(null, x.action.payload)
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

// register the demo actor
setTimeout(function () {
    incomingActors.onNext(actor);
}, 0);

// the arbiter takes all incoming messages throughout
// the entire system and distributes them as needed into
// the correct mailboxes
arbiter
    .withLatestFrom(register, function ({action, id}, register) {
        const [name, method] = action.type.split('.');
        return {
            action,
            register,
            name,
            id
        }
    })
    .filter(x => {
        return x.register[x.name];
    })
    .map(x => {
        const { action, register, name, id } = x;
        const match = register[name];

        return {
            id,
            action,
            mailbox: match['mailbox']
        }
    })
    .do(x => {
        x.mailbox.incoming.onNext({action: x.action, id: x.id});
    })
    .subscribe();

// the send method is how actors post messages to each other
// it's guaranteed to happen in an async manner
// ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
function ask(action, id = uuid()) {

    const trackResponse = responses
        .filter(x => x.respId === id)
        .map(x => x.response)
        .take(1);

    const messageSender = Rx.Observable.just({action, id}, Rx.Scheduler.async)
        .do(x => console.log('SEND->\n', x))
        .do(arbiter);

    return Rx.Observable.zip(trackResponse, messageSender, (resp) => resp);
}
// tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
/**
 * @param action
 * @param id
 * @return void
 */
function tell (action, id = uuid()) {
    Rx.Observable.just({action, id}, Rx.Scheduler.async)
        .do(x => console.log('SEND->\n', x))
        .do(arbiter)
        .subscribe();
}

tell({type: 'Customer.ping'});

const resp = ask({type: 'Customer.read', payload: '01'});
const resp2 = ask({type: 'Customer.reload'});

resp2.subscribe(x => {
    console.log('effect reponse', x);
});

resp.subscribe(x => {
    console.log('sd', x);
});

console.log('guaranteed async');
// console.log(resp);

// arbiter.onNext({type: 'Customer.read', payload: '01'});
// arbiter.onNext({type: 'Basket.empty'}); // todo handle missing names