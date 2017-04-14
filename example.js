const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const { Map } = require('immutable');
const { createSystem } = require('./dist/index');
const { create: FileWatcher} = require('./fixtures/watcher');
const { create: ServeStatic} = require('./fixtures/serveStatic');
const { create: Server} = require('./fixtures/server');

const bsOptions = Map({});

const userInput = {
    watch: 'test/fixtures',
    serveStatic: ['.'],
    server: true
};

const mapping = {
    watch: FileWatcher,
    serveStatic: ServeStatic,
    server: Server,
};

const system  = createSystem();

const actors = Object.keys(userInput)
    // invoke the factory
    .map(key => {
        return [key, system.createStateActor(mapping[key].call(null))];
    });

const transformQueue = actors
    .filter(([key, actorRef]) => {
        return (actorRef.hasAddress('transformOptions'));
    })

    .map(([key, actor]) => {
    const userOptions = userInput[key];
    return actor.ask('transformOptions', userOptions)
        .map(resp => [resp, key, actor])
});

// const initQueue = actors.map(([key, actor]) => {
//     const userOptions = userInput[key];
//     return actor.ask('init', userOptions)
//         .map(resp => [resp, key, actor])
// });
// console.log(queue);

// console.log(queue);
Rx.Observable.from(transformQueue)
    .concatAll().subscribe(([resp, key, actor]) => {
        console.log(resp);
    });

// const init    = actor.ask('init', userInput['watch']);

// // store.register(actor);
// store.register(actor2);

// const resp1  = store.ask({type: 'Customer.read', payload: '01'});
// const resp2  = store.ask({type: 'Basket.read', payload: '01'});

// store.ask({type: 'Basket.promise', payload: '01'})
//     .subscribe(function (x) {
//         console.log('PROMISE->', x);
//     });
//
// store.ask({type: 'Basket.refresh', payload: '01'})
//     .subscribe(function (x) {
//         console.log('OBS->', x);
//     });
