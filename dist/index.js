"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var actions_1 = require("./actions");
var responses_1 = require("./responses");
require("rxjs/add/operator/scan");
require("rxjs/add/operator/do");
require("rxjs/add/operator/withLatestFrom");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/map");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/switchMap");
require("rxjs/add/operator/distinctUntilChanged");
require("rxjs/add/operator/startWith");
require("rxjs/add/operator/take");
require("rxjs/add/observable/of");
var StaunchStore_1 = require("./StaunchStore");
exports.StaunchStore = StaunchStore_1.StaunchStore;
var ReducerTypes;
(function (ReducerTypes) {
    ReducerTypes[ReducerTypes["MappedReducer"] = 'MappedReducer'] = "MappedReducer";
    ReducerTypes[ReducerTypes["GlobalReducer"] = 'GlobalReducer'] = "GlobalReducer";
})(ReducerTypes = exports.ReducerTypes || (exports.ReducerTypes = {}));
function createStore(props) {
    if (props === void 0) { props = {}; }
    var mergedInitialState = alwaysMap(props.state);
    var store = new StaunchStore_1.StaunchStore(__assign({}, props, { state: mergedInitialState }));
    var subs = [];
    // stream
    subs.push(actions_1.actionStream(mergedInitialState, store.action$, store.storeReducers, store.mappedReducers)
        .subscribe(store.state$));
    /**
     * Setup responses for declarative cross-domain communication
     */
    subs.push(responses_1.handleResponses(store.actionsWithState$, store.storeResponses)
        .subscribe(function (action) { return store.dispatcher(action); }));
    store.addReducers(props.reducers);
    store.addEffects(props.effects);
    store.addMiddleware(props.middleware);
    store.addExtras(props.extras);
    return store;
}
exports.createStore = createStore;
function alwaysArray(input) {
    return [].concat(input).filter(Boolean);
}
exports.alwaysArray = alwaysArray;
function getMap(incoming) {
    return Immutable.Map(incoming);
}
exports.getMap = getMap;
function alwaysMap(input) {
    return Immutable.Map.isMap(input) ? input : Immutable.fromJS(input || {});
}
exports.alwaysMap = alwaysMap;
function isPlainObject(value) {
    var objectTag = '[object Object]';
    return Object.prototype.toString.call(value) === objectTag;
}
exports.isPlainObject = isPlainObject;
exports.default = createStore;
if ((typeof window !== 'undefined') && ((typeof window.staunch) === 'undefined')) {
    window.staunch = {
        createStore: createStore
    };
}
//# sourceMappingURL=index.js.map