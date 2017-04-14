const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const { createSystem } = require('./dist/index');
const { create: FileWatcher} = require('./watcher');

const userInput = {
    watch: 'test/fixtures'
};

const mapping = {
    watch: FileWatcher
};

const system  = createSystem();
const actor   = system.createStateActor(FileWatcher());
const init = actor.ask('init', 'first');

system.ask({type: 'FileWatcher.init', payload: 'hi'})
        .subscribe(x => console.log('hello!'));

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
