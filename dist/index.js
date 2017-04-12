"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = require("rx");
var createActor_1 = require("./createActor");
exports.createActor = createActor_1.createActor;
var createMailbox_1 = require("./createMailbox");
var uuid = require('uuid/v4');
function createStore() {
    // global register of available actors
    var register = new Rx.BehaviorSubject({});
    // stream for actors to register upon
    var incomingActors = new Rx.Subject();
    // responses stream where actors can 'reply' via an id
    var responses = new Rx.Subject();
    // an object containing all mailboxes
    var mailboxes = new Rx.BehaviorSubject({});
    // Create a global register containing actors by name
    // this is for the
    incomingActors
        .scan(function (acc, item) {
        acc[item.name] = item;
        return acc;
    }, {}).subscribe(register);
    // for incoming actors, create a mailbox for each
    var actorsWithMailboxes = incomingActors
        .map(function (actor) {
        var mailbox = createMailbox_1.createMailbox(actor);
        return {
            mailbox: mailbox,
            actor: actor
        };
    }).share();
    actorsWithMailboxes.scan(function (acc, _a) {
        var actor = _a.actor, mailbox = _a.mailbox;
        acc[actor.name] = mailbox;
        return acc;
    }, {}).subscribe(mailboxes);
    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    actorsWithMailboxes.flatMap(function (x) { return x.mailbox.outgoing; })
        .subscribe(function (x) { return responses.onNext(x); });
    // create an arbiter for handling incoming messages
    var arbiter = new Rx.Subject();
    // the arbiter takes all incoming messages throughout
    // the entire system and distributes them as needed into
    // the correct mailboxes
    arbiter
        .withLatestFrom(register, mailboxes, function (_a, register, mailboxes) {
        var action = _a.action, id = _a.id;
        var name = action.type.split('.')[0];
        return {
            action: action,
            actor: register[name],
            mailbox: mailboxes[name],
            register: register,
            name: name,
            id: id
        };
    })
        .filter(function (x) {
        return x.actor && x.mailbox;
    })
        .do(function (x) {
        x.mailbox.incoming.onNext({ action: x.action, id: x.id });
    })
        .subscribe();
    // the send method is how actors post messages to each other
    // it's guaranteed to happen in an async manner
    // ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
    function ask(action, id) {
        if (!id)
            id = uuid();
        var trackResponse = responses
            .filter(function (x) { return x.respId === id; })
            .map(function (x) { return x.response; })
            .take(1);
        var messageSender = Rx.Observable
            .just({ action: action, id: id }, Rx.Scheduler.async)
            .do(function (message) { return arbiter.onNext(message); });
        return Rx.Observable.zip(trackResponse, messageSender, function (resp) { return resp; });
    }
    /**
     * @param action
     * @param id
     * @return void
     */
    // tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
    function tell(action, id) {
        if (!id)
            id = uuid();
        Rx.Observable.just({ action: action, id: id }, Rx.Scheduler.async)
            .do(arbiter)
            .subscribe();
    }
    return {
        register: function (actor) {
            incomingActors.onNext(actor);
        },
        ask: ask,
        tell: tell
    };
}
exports.createStore = createStore;
//# sourceMappingURL=index.js.map