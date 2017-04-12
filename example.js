const Rx = require('rx');
const { concat, of, empty } = Rx.Observable;
const { createActor, createStore } = require('./dist/index');

const store = createStore();

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

store.register(actor);
store.register(actor2);

const resp  = store.ask({type: 'Customer.read', payload: '01'});
const resp2 = store.ask({type: 'Customer.reload', payload: {params: '01 async'}});
const resp3 = store.ask({type: 'Customer.reload', payload: {params: '02 async'}});
const resp4 = store.ask({type: 'Basket.refresh', payload: {params: '02 async'}});

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
