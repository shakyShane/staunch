const Rx = require('rx');
const { empty, of } = Rx.Observable;

module.exports.create = function (config) {
    return {
        name: 'FileWatcher',
        missing: function (payload, message) {
            // console.log('MISSING METHOD/EFFECT', payload);
            return Rx.Observable.throw(new Error('I cannot accept missing methods'));
        },
        effects: {
            promise: function (payload, message) {
                return Promise.resolve('Hi!');
            },
            refresh: function (payload, message) {
                return of('10').delay(10);
            },
            init: function(payload) {
                console.log('GOT');
                return of(payload).delay(1000);
            }
        }
    }
};