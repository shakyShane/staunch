import Rx = require('rx');
import Immutable = require('immutable');

export function createStore() {
    const actors       = {};
    const api          = {};
    const initialState = {};
    const state$       = new Rx.BehaviorSubject({});
    const actions      = new Rx.Subject();

    const stateUpdates = actions.scan((acc, item) => {
        return item.call(null, acc);
    }, {}).subscribe(state$);

    api.register = function (obj) {
        actors[obj.name] = obj;
        actions.onNext(function initModule(state) {
            return Object.assign({}, state, {[obj.name]: obj.state || {}})
        });
        return api;
    };

    api.actors = actors;

    api.send = function (sendName, payload) {
        const [name, _method] = sendName.split('.');
        const method = getMethod(name, _method, actors);

        return {
            receive(receiveName) {
                const [name, _method] = receiveName.split('.');
                const method  = getMethod(name, _method, actors);
                console.log(name, _method);
            }
        }
    };

    api.addresses = function () {
        return getAddresses(actors);
    };

    return api;
}

function getAddresses(actors) {
    return Object.keys(actors).reduce(function (acc, item) {
        const current = actors[item];
        const methods = Object.keys(current['methods'] || {});
        const effects = Object.keys(current['effects'] || {});
        return acc.concat(
            [...methods, ...effects].map(x => `${item}.${x}`)
        );
    }, []);
}

function getMethod(name, method, actors) {
    if (actors[name] && actors[name]['methods'][method]) {
        return actors[name]['methods'][method];
    }
}

function getReducer(name, method, actors) {
    if (actors[name] && actors[name]['reducers'][method]) {
        return actors[name]['reducers'][method];
    }
}