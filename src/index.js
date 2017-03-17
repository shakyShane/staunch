var Rx              = require('rx');
var Observable      = Rx.Observable;
var BehaviorSubject = Rx.BehaviorSubject;
var Subject         = Rx.Subject;

var Immutable       = require('immutable');
var fromJS          = Immutable.fromJS;
var Map             = Immutable.Map;

module.exports = function createStore(initialState, initialReducers, initialEffects, initialMiddleware, initialExtras) {

    var mergedInitialState = alwaysMap(initialState);
    var state$             = new BehaviorSubject(mergedInitialState);

    var userExtra$ = new BehaviorSubject({});
    var newExtras$   = new Subject();
    newExtras$.scan(function (extras, incoming) {
        return Object.assign({}, extras, incoming);
    }, {}).share().subscribe(userExtra$);

    // stream of actions
    var action$ = new Subject();

    // reducers to act upon state
    var storeReducers = new BehaviorSubject([]);
    var newReducer$   = new Subject();
    newReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).share().subscribe(storeReducers);

    // Mapped reducers
    var mappedReducers    = new BehaviorSubject([]);
    var newMappedReducer$ = new Subject();
    newMappedReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).share().subscribe(mappedReducers);

    // stream
    var stateUpdate$ = action$
        .do(function (action) {
            if (!isPlainObject(action)) {
                return console.error('Please provide an object with at least a `type` property');
            }
            if ((typeof action.type) !== 'string') {
                return console.error('Action was missing a `type` property', action);
            }
        })
        .withLatestFrom(storeReducers, mappedReducers, function (action, reducers, mappedReducers) {

            const mappedReducersThatMatchAction = mappedReducers.filter(function (reducer) {
                return reducer.name === action.type
            });

            return {
                action: action, 
                reducers: mappedReducersThatMatchAction.concat(reducers),
            }
        })
        .scan(function(accMap, incoming) {

            var action = incoming.action;
            var reducers = incoming.reducers;

            var actionType = action.type || (typeof action === 'string' ? action : '');

            // is it a @@namespace ?
            if (actionType.indexOf('@@NS-INIT') === 0) {

                return accMap.setIn(action.payload.path, alwaysMap((action.payload || {}).value))

            } else {
                return reducers.reduce(function (outgoingValue, reducer) {
                    return outgoingValue.updateIn(reducer.path, function(currentValue) {
                        return reducer.fns.reduce(function (value, fn) {
                            return fn.call(null, value, action, outgoingValue);
                        }, currentValue)
                    });
                }, accMap);
            }
        }, mergedInitialState).share();

    // Push all state updates back onto state$ value
    stateUpdate$
        .catch(function (err) {
            // console.error(err);
            return Rx.Observable.throw(err);
        })
        .subscribe(state$);

    var actionsWithState$ = action$.withLatestFrom(state$, function (action, state) { return {action: action, state: state} });

    var storeExtras = {
        state$: state$,
        action$: action$,
        actionsWithState$: actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$
    };

    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    function _dispatcher(action) {
        if (Array.isArray(action)) {
            return action.forEach(function(a) {
                action$.onNext(a)
            });
        }
        return action$.onNext(action);
    }

    /**
     * Add either plain functions or {path, fns} pairs
     * @param reducers
     * @private
     */
    function _addReducers (reducers) {
        [].concat(reducers).filter(Boolean).forEach(function (r) {
            /**
             *
             */
            if (typeof r === 'function') {
                newReducer$.onNext({
                    path: [],
                    fns: [].concat(r).filter(Boolean)
                });
            }

            if (isPlainObject(r)) {
                if (r.state) {
                    if (r.reducers) {

                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        Object.keys(r.state).forEach(function (stateKey) {
                            _addReducers({path: stateKey,  fns: r.reducers});
                        });

                        /**
                         *
                         */
                        _registerOnStateTree(r.state);
                    }
                    if (r.effects) {
                        _addEffects(r.effects);
                    }
                    return;
                }
                if (r.path && r.reducers) {
                    Object.keys(r.reducers).forEach(function (name) {
                        const currentFn = r.reducers[name];
                        newMappedReducer$.onNext({
                            path: r.path,
                            fns: [currentFn],
                            name
                        });
                    });
                    return;
                }
                /**
                 * if path/fn pairs given
                 */
                if (r.path && r.fns) {
                    newReducer$.onNext({
                        path: [].concat(r.path).filter(Boolean),
                        fns: [].concat(r.fns).filter(Boolean)
                    });
                } else {
                    // redux style key: fn pairs
                    for (var key in r) {
                        newReducer$.onNext({
                            path: [].concat(key).filter(Boolean),
                            fns: [].concat(r[key]).filter(Boolean)
                        });
                    }
                }
            }
        });
    }

    function _addEffects (effects) {
        const actionsApi = {
            ofType: function (actionName) {
                return actionsWithState$.filter(function (incoming) {
                    return incoming.action.type === actionName;
                });
            }
        };

        const extras = Object.assign({}, storeExtras, userExtra$.getValue());

        [].concat(effects).filter(Boolean).forEach(function (effect) {
            effect.call(null, actionsApi, extras).forEach(function (action) {
                _dispatcher(action);
            });
        });
    }

    function _addMiddleware(middleware) {
        [].concat(middleware).filter(Boolean).forEach(function (middleware) {
            middleware.call(null, api);
        })
    }

    function _addExtras(extras) {
        [].concat(extras).filter(Boolean).forEach(function (extra) {
            newExtras$.onNext(extra);
        });
    }

    function _registerOnStateTree(state) {
        for (var key in state) {
            // now init with action
            _dispatcher({
                type: '@@NS-INIT('+ key +')',
                payload: {
                    path: [key],
                    value: state[key]
                }
            });
        }
    }

    var api = {
        state$: state$,
        action$: action$,
        actionsWithState$: actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$,
        register: function (input) {
            var state    = input.state;
            var reducers = input.reducers;
            var effects  = input.effects;

            if (reducers) {
                _addReducers(reducers);
                _registerOnStateTree(state);
            }

            if (effects) {
                _addEffects(effects);
            }

            return api;
        },
        addReducers: function (reducers) {
            _addReducers(reducers);
            return api;
        },
        dispatch: function (action) {
            _dispatcher(action);
            return api;
        },
        getState: function (path) {
            var lookup = [].concat(path).filter(Boolean);
            return state$.getValue().getIn(lookup, Map({}));
        },
        toJS: function (path) {
            var lookup = [].concat(path).filter(Boolean);
            return state$.getValue().getIn(lookup, Map({})).toJS();
        },
        toJSON: function (path) {
            var lookup = [].concat(path).filter(Boolean);
            return state$.getValue().getIn(lookup, Map({})).toJSON();
        },
        addMiddleware: function (middleware) {
            _addMiddleware(middleware);
            return api;
        },
        once: function (actions) {
            const lookup = [].concat(actions);
            return actionsWithState$.filter(x => {
                return lookup.indexOf(x.action.type) > -1;
            }).take(1);
        }
    };

    // add initial ones
    _addReducers(initialReducers);
    _addEffects(initialEffects);
    _addMiddleware(initialMiddleware);
    _addExtras(initialExtras);

    function alwaysMap (input) { return Map.isMap(input) ? input : fromJS(input || {}) };

    function isPlainObject(value) {
        var objectTag = '[object Object]';

        return Object.prototype.toString.call(value) === objectTag;
    }

    return api;
};

