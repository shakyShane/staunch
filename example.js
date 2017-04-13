const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const { createActor, createStateActor, createStore } = require('./dist/index');

const store = createStore();

// now create 1 actor for demonstration purposes
const actor = createActor({
    name: 'Customer',
    receive: function (message, sender) {
        sender.reply(`PONG 1 -> ${JSON.stringify(message)}`);
    }
});
const actor2 = createStateActor({
    name: 'Basket',
    missing: function (payload, message) {
        console.log('MISSING METHOD/EFFECT', payload);
        return empty();
    },
    effects: {
        promise: function (payload, message) {
            return Promise.resolve('Hi!');
        },
        refresh: function (payload, message) {
            return of('10').delay(10);
        }
    }
});

store.register(actor);
store.register(actor2);

const resp1  = store.ask({type: 'Customer.read', payload: '01'});
const resp2  = store.ask({type: 'Basket.read', payload: '01'});
store.ask({type: 'Basket.promise', payload: '01'})
    .subscribe(function (x) {
        console.log('PROMISE->', x);
    });
store.ask({type: 'Basket.refresh', payload: '01'})
    .subscribe(function (x) {
        console.log('OBS->', x);
    });
// const resp2 = store.ask({type: 'Customer.reload', payload: {params: '01 async'}});
// const resp3 = store.ask({type: 'Customer.reload', payload: {params: '02 async'}});
// const resp4 = store.ask({type: 'Basket.refresh', payload: {params: '02 async'}});

resp1.subscribe(x => {
    console.log(`PING -> ${x}`);
});

resp2.subscribe(x => {
    console.log('RECEIVE 1 -> effect response', x);
});
//
// resp3.subscribe(x => {
//     console.log('RECEIVE 2 -> effect response', x);
// });
//
// resp4.subscribe(x => {
//     console.log('RECEIVE BASKET', x);
// })
