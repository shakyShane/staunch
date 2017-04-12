import Rx = require('rx');
import Immutable = require('immutable');
import {createActor} from './createActor';
import {createMailbox} from "./createMailbox";
const uuid = require('uuid/v4');

export function createStore() {
    // global register of available actors
    const register       = new Rx.BehaviorSubject({});
    // stream for actors to register upon
    const incomingActors = new Rx.Subject();
    // responses stream where actors can 'reply' via an id
    const responses      = new Rx.Subject();
    // an object containing all mailboxes
    const mailboxes      = new Rx.BehaviorSubject({});

    // Create a global register containing actors by name
    // this is for the
    incomingActors
        .scan(function (acc, item) {
            acc[item.name] = item;
            return acc;
        }, {}).subscribe(register);

    // for incoming actors, create a mailbox for each
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

    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    actorsWithMailboxes.flatMap(x => x.mailbox.outgoing)
        .subscribe(x => responses.onNext(x));

    // create an arbiter for handling incoming messages
    const arbiter = new Rx.Subject();

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

    // the send method is how actors post messages to each other
    // it's guaranteed to happen in an async manner
    // ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
    function ask(action, id) {
        if (!id) id = uuid();

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

    return {
        register(actor) {
            incomingActors.onNext(actor)
        },
        ask,
        tell
    }
}

export {
    createActor
};

