const Rx = require('rx');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');

const Option = Immutable.Record({
    dir: '',
});

function createFromString(input) {
    return new Option({dir: input});
}

module.exports.create = function (config) {

    const options = Immutable.List([]);

    return {
        name: 'FileWatcher',
        missing: function (payload, message) {
            console.log(message);
            // console.log('MISSING METHOD/EFFECT', payload);
            return Rx.Observable.throw(new Error('I cannot accept missing methods'));
        },
        methods: {
            transformOptions: function(payload) {
                if (typeof payload === 'string') {
                    return options.concat(createFromString(payload));
                }
            }
        },
        effects: {
            promise: function (payload, message) {
                return Promise.resolve('Hi!');
            },
            refresh: function (payload, message) {
                return of('10').delay(10);
            },
            init: function(payload) {
                return of(payload).delay(1000);
            }
        }
    }
};