"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = require("rx");
function createStore() {
    var actors = {};
    var api = {};
    var initialState = {};
    var state$ = new Rx.BehaviorSubject({});
    var actions = new Rx.Subject();
    var stateUpdates = actions.scan(function (acc, item) {
        return item.call(null, acc);
    }, {}).subscribe(state$);
    api.register = function (obj) {
        actors[obj.name] = obj;
        actions.onNext(function initModule(state) {
            return Object.assign({}, state, (_a = {}, _a[obj.name] = obj.state || {}, _a));
            var _a;
        });
        return api;
    };
    api.actors = actors;
    api.send = function (sendName, payload) {
        var _a = sendName.split('.'), name = _a[0], _method = _a[1];
        var method = getMethod(name, _method, actors);
        return {
            receive: function (receiveName) {
                var _a = receiveName.split('.'), name = _a[0], _method = _a[1];
                var method = getMethod(name, _method, actors);
                console.log(name, _method);
            }
        };
    };
    api.addresses = function () {
        return getAddresses(actors);
    };
    return api;
}
exports.createStore = createStore;
function getAddresses(actors) {
    return Object.keys(actors).reduce(function (acc, item) {
        var current = actors[item];
        var methods = Object.keys(current['methods'] || {});
        var effects = Object.keys(current['effects'] || {});
        return acc.concat(methods.concat(effects).map(function (x) { return item + "." + x; }));
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
//# sourceMappingURL=index.js.map