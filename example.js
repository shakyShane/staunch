const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const uuid = require('uuid');

// global register of available actors
const register       = new Rx.BehaviorSubject({});
// stream for actors to register upon
const incomingActors = new Rx.Subject();
// responses stream where actors can 'reply' via an id
const responses      = new Rx.Subject();

// an object containing all mailboxes
const mailboxes      = new Rx.BehaviorSubject({});

// for incoming actors, create a mailbox for each
incomingActors
    // Create a global register containing actors by name
    // this is for the
    .scan(function (acc, item) {
        acc[item.name] = item;
        return acc;
    }, {}).subscribe(register);

// now create a mailbox foe
const actorsWithMailboxes = incomingActors
    .map(actor => {
        const mailbox = createMailbox(actor);
        return {
            mailbox,
            actor
        }
    }).share();

actorsWithMailboxes.scan((acc, { actor, mailbox }) => {
    acc[actor.name] = mailbox;
    return acc;
}, {}).subscribe(mailboxes);

actorsWithMailboxes.flatMap(x => x.mailbox.outgoing)
    .subscribe(x => responses.onNext(x));

// create an arbiter for handling incoming messages
const arbiter = new Rx.Subject();

// now create 1 actor for demonstration purposes
const actor = createActor({
    name: 'Customer',
    methods: {
        // example 'sync' method called read
        // that will return immediately
        read: function (payload, id) {
            return 'shane is learning actor model';
        },
        ping: function (payload, message) {
            return JSON.stringify(message);
        }
    },
    effects: {
        // example 'async' effect that will take 5 seconds to
        // respond
        reload: function (payload, message) {
            return of(JSON.stringify(payload)).delay(5000);
        }
    }
});
const actor2 = createActor({
    name: 'Basket',
    effects: {
        refresh: function (payload, message) {
            return of(JSON.stringify(payload)).delay(1000);
        }
    }
});
function createActor (input) {
    const state = {name: 'kittie'};
    let messages = [];
    return input;
}

// A mailbox knows how to map incoming messages
// onto sync/async methods
function createMailbox(actor) {

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



// the arbiter takes all incoming messages throughout
// the entire system and distributes them as needed into
// the correct mailboxes
arbiter
    .withLatestFrom(register, mailboxes, function ({action, id}, register, mailboxes) {
        const [ name ] = action.type.split('.');
        return {
            action,
            actor: register[name],
            mailbox: mailboxes[name],
            register,
            name,
            id
        }
    })
    .filter(x => {
        return x.actor && x.mailbox;
    })
    .do(x => {
        x.mailbox.incoming.onNext({action: x.action, id: x.id});
    })
    .subscribe();

// register the demo actor
Rx.Observable.of(actor, actor2)
    .subscribe(actor => incomingActors.onNext(actor));

// the send method is how actors post messages to each other
// it's guaranteed to happen in an async manner
// ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
function ask(action, id) {
    if (!id) {
        id = uuid();
    }
    const trackResponse = responses
        .filter(x => x.respId === id)
        .map(x => x.response)
        .take(1);

    const messageSender = Rx.Observable
        .just({action, id}, Rx.Scheduler.async)
        .do(message => arbiter.onNext(message));

    return Rx.Observable.zip(trackResponse, messageSender, (resp) => resp);
}
/**
 * @param action
 * @param id
 * @return void
 */
// tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
function tell (action, id) {
    if (!id) id = uuid();
    Rx.Observable.just({action, id}, Rx.Scheduler.async)
        .do(arbiter)
        .subscribe();
}

const resp  = ask({type: 'Customer.read', payload: '01'});
const resp2 = ask({type: 'Customer.reload', payload: {params: '01 async'}});
const resp3 = ask({type: 'Customer.reload', payload: {params: '02 async'}});
const resp4 = ask({type: 'Basket.refresh', payload: {params: '02 async'}});

resp.subscribe(x => {
    console.log('RECEIVE 1 -> sync', x);
});

resp2.subscribe(x => {
    console.log('RECEIVE 1 -> effect response', x);
});

resp3.subscribe(x => {
    console.log('RECEIVE 2 -> effect response', x);
});

resp4.subscribe(x => {
    console.log('RECEIVE BASKET', x);
})
