(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var BehaviorSubject_1 = (typeof window !== "undefined" ? window['Rx'] : typeof global !== "undefined" ? global['Rx'] : null);
var Subject_1 = (typeof window !== "undefined" ? window['Rx'] : typeof global !== "undefined" ? global['Rx'] : null);
var subjects_1 = require("./subjects");
var addEffects_1 = require("./addEffects");
var addReducers_1 = require("./addReducers");
var StaunchStore = (function () {
    function StaunchStore(props) {
        this.isOpen = true;
        this.state$ = new BehaviorSubject_1.BehaviorSubject(props.state);
        this.subs = [];
        this.userExtra$ = new BehaviorSubject_1.BehaviorSubject({});
        this.newExtras$ = new Subject_1.Subject();
        this.subs.push(this.newExtras$.scan(subjects_1.assignFn, {}).subscribe(this.userExtra$));
        // reducers to act upon state
        this.storeReducers = new BehaviorSubject_1.BehaviorSubject([]);
        this.newReducer$ = new Subject_1.Subject();
        this.subs.push(this.newReducer$.scan(subjects_1.concatFn, []).subscribe(this.storeReducers));
        // Mapped reducers
        this.mappedReducers = new BehaviorSubject_1.BehaviorSubject([]);
        this.newMappedReducer$ = new Subject_1.Subject();
        this.subs.push(this.newMappedReducer$.scan(subjects_1.concatFn, []).subscribe(this.mappedReducers));
        // responses
        this.storeResponses = new BehaviorSubject_1.BehaviorSubject([]);
        this.newResponses = new Subject_1.Subject();
        this.subs.push(this.newResponses.scan(subjects_1.concatFn, []).subscribe(this.storeResponses));
        // stream of actions
        this.action$ = new Subject_1.Subject();
        this.actionsWithState$ = this.action$.withLatestFrom(this.state$, function (action, state) {
            return {
                action: action,
                state: state
            };
        });
        this.actionsWithResultingStateUpdate$ = this.actionsWithState$;
    }
    StaunchStore.prototype.register = function (input) {
        var state = input.state, reducers = input.reducers, effects = input.effects, responses = input.responses;
        if (state) {
            this._registerOnStateTree(state);
        }
        if (reducers) {
            this._addReducers(reducers);
        }
        if (effects) {
            this._addEffects(effects);
        }
        if (responses) {
            this._addResponses(responses);
        }
        return this;
    };
    StaunchStore.prototype._registerOnStateTree = function (state) {
        for (var key in state) {
            // now init with action
            this.dispatcher({
                type: '@@NS-INIT(' + key + ')',
                payload: {
                    path: [key],
                    value: state[key]
                }
            });
        }
    };
    StaunchStore.prototype._addExtras = function (extras) {
        var _this = this;
        index_1.alwaysArray(extras).forEach(function (extra) {
            _this.newExtras$.next(extra);
        });
    };
    StaunchStore.prototype._addResponses = function (responses) {
        var _this = this;
        index_1.alwaysArray(responses).forEach(function (resp) {
            Object.keys(resp).forEach(function (actionName) {
                var item = resp[actionName];
                _this.newResponses.next({
                    name: actionName,
                    path: [].concat(item.path).filter(Boolean),
                    targetName: item.action
                });
            });
        });
    };
    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    StaunchStore.prototype.dispatcher = function (action) {
        var _this = this;
        if (!this.isOpen) {
            return;
        }
        if (Array.isArray(action)) {
            return action.forEach(function (a) {
                _this.action$.next(a);
            });
        }
        return this.action$.next(action);
    };
    StaunchStore.prototype._addMiddleware = function (middleware) {
        var _this = this;
        index_1.alwaysArray(middleware).forEach(function (middleware) {
            middleware.call(null, _this);
        });
    };
    StaunchStore.prototype._addEffects = function (incoming) {
        var _this = this;
        /**
         * Default extras that get passed to all 'effects'
         */
        var storeExtras = {
            state$: this.state$,
            action$: this.action$,
            actionsWithState$: this.actionsWithState$,
            actionsWithResultingStateUpdate$: this.actionsWithState$
        };
        addEffects_1.gatherEffects(incoming, this.actionsWithState$, storeExtras, this.userExtra$)
            .forEach(function (outgoing) {
            if (outgoing.type === addReducers_1.InputTypes.Effect) {
                _this.subs.push(outgoing.payload.subscribe(_this.dispatcher.bind(_this)));
            }
        });
    };
    StaunchStore.prototype._addReducers = function (incoming) {
        var _this = this;
        addReducers_1.gatherReducers(incoming)
            .forEach(function (outgoing) {
            if (outgoing.type === addReducers_1.InputTypes.Reducer) {
                _this.newReducer$.next(outgoing.payload);
            }
            if (outgoing.type === addReducers_1.InputTypes.MappedReducer) {
                _this.newMappedReducer$.next(outgoing.payload);
            }
            if (outgoing.type === addReducers_1.InputTypes.State) {
                _this._registerOnStateTree(outgoing.payload);
            }
        });
    };
    StaunchStore.prototype.addReducers = function (reducers) {
        this._addReducers(reducers);
        return this;
    };
    StaunchStore.prototype.dispatch = function (action) {
        this.dispatcher(action);
        return this;
    };
    StaunchStore.prototype.getState = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({}));
    };
    StaunchStore.prototype.toJS = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({})).toJS();
    };
    StaunchStore.prototype.toJSON = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({})).toJSON();
    };
    StaunchStore.prototype.addMiddleware = function (middleware) {
        this._addMiddleware(middleware);
        return this;
    };
    StaunchStore.prototype.changes = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.map(function (x) { return x.getIn(lookup); })
            .distinctUntilChanged();
    };
    StaunchStore.prototype.once = function (actions) {
        var lookup = index_1.alwaysArray(actions);
        return this.actionsWithState$.filter(function (x) {
            return lookup.indexOf(x.action.type) > -1;
        }).take(1);
    };
    StaunchStore.prototype.addExtras = function (extras) {
        this._addExtras(extras);
        return this;
    };
    StaunchStore.prototype.addEffects = function (effects) {
        this._addEffects(effects);
        return this;
    };
    StaunchStore.prototype.close = function () {
        if (this.isOpen) {
            this.subs.forEach(function (sub) { return sub.unsubscribe(); });
            this.isOpen = false;
        }
        return this;
    };
    StaunchStore.prototype.ofType = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.actionsWithState$
            .filter(function (_a) {
            var action = _a.action;
            return lookup.indexOf(action.type) > -1;
        });
    };
    return StaunchStore;
}());
exports.StaunchStore = StaunchStore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./addEffects":3,"./addReducers":4,"./index":5,"./subjects":7}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
function actionStream(intialState, action$, storeReducers, mappedReducers) {
    return action$
        .do(function (action) {
        if (!index_1.isPlainObject(action)) {
            return console.error('Please provide an object with at least a `type` property');
        }
        if ((typeof action.type) !== 'string') {
            return console.error('Action was missing a `type` property', action);
        }
    })
        .withLatestFrom(storeReducers, mappedReducers, function (action, reducers, mappedReducers) {
        var mappedReducersThatMatchAction = mappedReducers
            .filter(function (reducer) {
            return reducer.name === action.type;
        });
        return {
            action: action,
            reducers: mappedReducersThatMatchAction.concat(reducers),
        };
    })
        .scan(function (stateMap, _a) {
        var action = _a.action, reducers = _a.reducers;
        var actionType = action.type || (typeof action === 'string' ? action : '');
        // is it a @@namespace ?
        if (actionType.indexOf('@@NS-INIT') === 0) {
            return stateMap.setIn(action.payload.path, index_1.alwaysMap((action.payload || {}).value));
        }
        else {
            /**
             * Iterate through all valid reducers
             * This will include those registered via simple functions
             * + those mapped to a path with a specific Action name
             */
            return reducers.reduce(function (outgoingValue, reducer) {
                /**
                 * Decide whether to pass {type: NAME, payload: VALUE}
                 *                   or   VALUE only into the reducer
                 *
                 */
                var reducerPayload = reducer.type === index_1.ReducerTypes.MappedReducer
                    ? action.payload
                    : action;
                /**
                 * Now use updateIn to call this reducers functions (there could be many)
                 * on the value that lives at this point of the tree
                 */
                return outgoingValue.updateIn(reducer.path, function (currentValue) {
                    return reducer.fns.reduce(function (value, fn) {
                        return fn.call(null, value, reducerPayload, outgoingValue);
                    }, currentValue);
                });
            }, stateMap);
        }
    }, intialState);
}
exports.actionStream = actionStream;

},{"./index":5}],3:[function(require,module,exports){
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
var index_1 = require("./index");
var addReducers_1 = require("./addReducers");
function gatherEffects(incoming, actionsWithState$, storeExtras, userExtra$) {
    var actionsApi = {
        ofType: function (actionName) {
            return actionsWithState$.filter(function (incoming) {
                return incoming.action.type === actionName;
            });
        }
    };
    var extras = Object.assign({}, storeExtras, userExtra$.getValue());
    return index_1.alwaysArray(incoming).reduce(function (acc, effect) {
        if (typeof effect !== 'function') {
            console.error('Effects must be functions, you provided', effect);
        }
        var stream = (function () {
            if (effect.triggers && Array.isArray(effect.triggers)) {
                return actionsWithState$.filter(function (incoming) {
                    return ~effect.triggers.indexOf(incoming.action.type);
                });
            }
            if (effect.trigger && typeof effect.trigger === 'string') {
                return actionsWithState$.filter(function (incoming) {
                    return effect.trigger === incoming.action.type;
                });
            }
            return actionsApi;
        })();
        // todo, verify the output of this ie: ensure an observable
        // was returned
        var effectOutput = effect.call(null, stream, extras);
        return acc.concat({
            type: addReducers_1.InputTypes.Effect,
            payload: effectOutput.map(function (action) {
                return __assign({}, action, { via: '[effect]', name: (effect.name || '') });
            })
        });
    }, []);
}
exports.gatherEffects = gatherEffects;

},{"./addReducers":4,"./index":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
/**
 * Add either plain functions or {path, fns} pairs
 * @param reducers
 * outputTypes:
 *  - reducer
 *  - mappedReducer
 *  - effect
 *  - state
 * @private
 */
var InputTypes;
(function (InputTypes) {
    InputTypes[InputTypes["Reducer"] = 'Reducer'] = "Reducer";
    InputTypes[InputTypes["MappedReducer"] = 'MappedReducers'] = "MappedReducer";
    InputTypes[InputTypes["Effect"] = 'Effect'] = "Effect";
    InputTypes[InputTypes["State"] = 'State'] = "State";
})(InputTypes = exports.InputTypes || (exports.InputTypes = {}));
function gatherReducers(incoming) {
    return _addReducers(incoming, []);
    function _addReducers(reducers, initial) {
        return index_1.alwaysArray(reducers).reduce(function (acc, reducer) {
            if (typeof reducer === 'function') {
                return acc.concat({
                    type: InputTypes.Reducer,
                    payload: {
                        path: [],
                        fns: [reducer]
                    }
                });
            }
            if (index_1.isPlainObject(reducer)) {
                if (reducer.state) {
                    var reducers_1, state = void 0, effects = void 0;
                    if (reducer.reducers) {
                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        reducers_1 = Object.keys(reducer.state).reduce(function (acc, stateKey) {
                            return acc.concat(_addReducers({ path: stateKey, fns: reducer.reducers }, []));
                        }, []);
                    }
                    if (reducer.effects) {
                        effects = reducer.effects;
                    }
                    /**
                     *
                     */
                    state = reducer.state;
                    return acc.concat(reducers_1, {
                        type: InputTypes.Effect,
                        payload: effects
                    }, {
                        type: InputTypes.State,
                        payload: state
                    });
                }
                if (reducer.path && reducer.reducers) {
                    var maps = Object.keys(reducer.reducers).reduce(function (acc, name) {
                        var currentFn = reducer.reducers[name];
                        return acc.concat({
                            type: InputTypes.MappedReducer,
                            payload: {
                                path: [].concat(reducer.path),
                                fns: [currentFn],
                                name: name,
                                type: index_1.ReducerTypes.MappedReducer
                            }
                        });
                    }, []);
                    return acc.concat(maps);
                }
                /**
                 * if path/fn pairs given
                 */
                if (reducer.path && reducer.fns) {
                    return acc.concat({
                        type: InputTypes.Reducer,
                        payload: {
                            path: [].concat(reducer.path).filter(Boolean),
                            fns: [].concat(reducer.fns).filter(Boolean)
                        }
                    }, initial);
                }
                else {
                    // redux style key: fn pairs
                    var outgoing = Object.keys(reducer).reduce(function (acc, key) {
                        return acc.concat({
                            type: InputTypes.Reducer,
                            payload: {
                                path: [].concat(key).filter(Boolean),
                                fns: [].concat(reducer[key]).filter(Boolean)
                            }
                        });
                    }, []);
                    return acc.concat(outgoing);
                }
            }
            return acc;
        }, initial);
    }
}
exports.gatherReducers = gatherReducers;

},{"./index":5}],5:[function(require,module,exports){
(function (global){
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
var Immutable = (typeof window !== "undefined" ? window['Immutable'] : typeof global !== "undefined" ? global['Immutable'] : null);
var actions_1 = require("./actions");
var responses_1 = require("./responses");
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
require('./../noop.js');
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./../noop.js":8,"./StaunchStore":1,"./actions":2,"./responses":6}],6:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = (typeof window !== "undefined" ? window['Rx'] : typeof global !== "undefined" ? global['Rx'] : null);
var index_1 = require("./index");
function handleResponses(actionsWithState$, storeResponses) {
    /**
     * Setup responses for declarative cross-domain communication
     */
    return actionsWithState$
        .withLatestFrom(storeResponses)
        .filter(function (_a) {
        var _ = _a[0], storeResponses = _a[1];
        return storeResponses.length > 0;
    })
        .flatMap(function (incoming) {
        var _a = incoming[0], action = _a.action, state = _a.state;
        var storeResponses = incoming[1];
        var actionName = action.type;
        var matchingResponses = storeResponses
            .filter(function (response) { return response.name === actionName; });
        var newActions = matchingResponses.map(function (x) {
            return {
                type: x.targetName,
                payload: state.getIn(x.path, index_1.getMap({})).toJS(),
                via: "[response to (" + actionName + ")]"
            };
        });
        return Observable_1.Observable.of(newActions);
    });
}
exports.handleResponses = handleResponses;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./index":5}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function assignFn(extras, incoming) {
    return Object.assign({}, extras, incoming);
}
exports.assignFn = assignFn;
function concatFn(acc, incoming) {
    return acc.concat(incoming);
}
exports.concatFn = concatFn;

},{}],8:[function(require,module,exports){
//

},{}]},{},[5])
//# sourceMappingURL=staunch.js.map
