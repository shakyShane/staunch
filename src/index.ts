import Rx = require('rx');
import Immutable = require('immutable');

const BehaviorSubject = Rx.BehaviorSubject;
const Subject = Rx.Subject;

export interface IAction {
    type: string
    payload?: any
    via?: string
}

export enum ReducerTypes {
    MappedReducer = <any>'MappedReducer',
    GlobalReducer = <any>'GlobalReducer'
}

export function createStore(initialState: object,
                            initialReducers,
                            initialEffects,
                            initialMiddleware,
                            initialExtras) {

    const mergedInitialState = alwaysMap(initialState);
    const state$ = new BehaviorSubject(mergedInitialState);

    const userExtra$ = new BehaviorSubject({});
    const newExtras$ = new Subject();
    newExtras$.scan(function (extras, incoming) {
        return Object.assign({}, extras, incoming);
    }, {}).subscribe(userExtra$);

    // stream of actions
    const action$ = new Subject();

    // reducers to act upon state
    const storeReducers = new BehaviorSubject([]);
    const newReducer$ = new Subject();
    newReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(storeReducers);

    // Mapped reducers
    const mappedReducers = new BehaviorSubject([]);
    const newMappedReducer$ = new Subject();
    newMappedReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(mappedReducers);

    // responses
    const storeResponses = new BehaviorSubject([]);
    const newResponses = new Subject();
    newResponses.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(storeResponses);

    // stream
    const stateUpdate$ = action$
        .do(function (action) {
            if (!isPlainObject(action)) {
                return console.error('Please provide an object with at least a `type` property');
            }
            if ((typeof action.type) !== 'string') {
                return console.error('Action was missing a `type` property', action);
            }
        })
        .withLatestFrom(storeReducers, mappedReducers, function (action, reducers, mappedReducers) {

            const mappedReducersThatMatchAction = mappedReducers
                .filter((reducer) => {
                    return reducer.name === action.type;
                });

            return {
                action: action,
                reducers: mappedReducersThatMatchAction.concat(reducers),
            }
        })
        .scan(function (stateMap, {action, reducers}) {

            const actionType = action.type || (typeof action === 'string' ? action : '');

            // is it a @@namespace ?
            if (actionType.indexOf('@@NS-INIT') === 0) {

                return stateMap.setIn(action.payload.path, alwaysMap((action.payload || {}).value))

            } else {

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
                    const reducerPayload = reducer.type === ReducerTypes.MappedReducer
                        ? action.payload
                        : action;

                    /**
                     * Now use updateIn to call this reducers functions (there could be many)
                     * on the value that lives at this point of the tree
                     */
                    return outgoingValue.updateIn(reducer.path, function (currentValue) {
                        return reducer.fns.reduce(function (value, fn) {
                            return fn.call(null, value, reducerPayload, outgoingValue);
                        }, currentValue)
                    });
                }, stateMap);
            }
        }, mergedInitialState).share();

    // Push all state updates back onto state$ value
    stateUpdate$
        .catch(function (err) {
            // console.error(err);
            return Rx.Observable.throw(err);
        })
        .subscribe(state$);

    /**
     * Create a stream that has updates + resulting state updates
     */
    const actionsWithState$ = action$.withLatestFrom(state$, function (action, state) {
        return {
            action,
            state
        }
    });

    const storeExtras = {
        state$,
        action$,
        actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$
    };

    /**
     * Setup responses for declarative cross-domain communication
     */
    actionsWithState$
        .withLatestFrom(storeResponses)
        .filter(([_, storeResponses]) => storeResponses.length > 0)
        .flatMap(incoming => {
            const {action, state}   = incoming[0];
            const storeResponses    = incoming[1];
            const actionName        = action.type;

            const matchingResponses = storeResponses
                .filter(response => response.name === actionName);

            const newActions = matchingResponses.map(x => {
                return {
                    type: x.targetName,
                    payload: state.getIn(x.path, getMap({})).toJS(),
                    via: `[response to (${actionName})]`
                }
            });

            return Rx.Observable.from(newActions);
        })
        .subscribe(action => _dispatcher(action));

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
        alwaysArray(reducers).forEach(function (reducer) {

            if (typeof reducer === 'function') {
                newReducer$.onNext({
                    path: [],
                    fns: [].concat(reducer).filter(Boolean)
                });
            }

            if (isPlainObject(reducer)) {
                if (reducer.state) {
                    if (reducer.reducers) {

                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        Object.keys(reducer.state).forEach(function (stateKey) {
                            _addReducers({path: stateKey,  fns: reducer.reducers});
                        });

                    }
                    if (reducer.effects) {
                        _addEffects(reducer.effects);
                    }
                    /**
                     *
                     */
                    _registerOnStateTree(reducer.state);
                    return;
                }
                if (reducer.path && reducer.reducers) {
                    Object.keys(reducer.reducers).forEach(function (name) {
                        const currentFn = reducer.reducers[name];
                        newMappedReducer$.onNext({
                            path: [].concat(reducer.path),
                            fns: [currentFn],
                            name,
                            type: ReducerTypes.MappedReducer
                        });
                    });
                    return;
                }
                /**
                 * if path/fn pairs given
                 */
                if (reducer.path && reducer.fns) {
                    newReducer$.onNext({
                        path: [].concat(reducer.path).filter(Boolean),
                        fns: [].concat(reducer.fns).filter(Boolean)
                    });
                } else {
                    // redux style key: fn pairs
                    for (let key in reducer) {
                        newReducer$.onNext({
                            path: [].concat(key).filter(Boolean),
                            fns: [].concat(reducer[key]).filter(Boolean)
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

        alwaysArray(effects).forEach(function (effect) {
            effect.call(null, actionsApi, extras)
            // Make it clear where this action originated from
            .map(action => {
                return {
                    ...action,
                    via: '[effect]',
                    name: (effect.name || '')
                }
            })
            .forEach(function (action) {
                _dispatcher(action);
            });
        });
    }

    function _addMiddleware(middleware) {
        alwaysArray(middleware).forEach(function (middleware) {
            middleware.call(null, api);
        })
    }

    function _addExtras(extras) {
        alwaysArray(extras).forEach(function (extra) {
            newExtras$.onNext(extra);
        });
    }

    function _registerOnStateTree(state) {
        for (let key in state) {
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

    function _addResponses (responses) {
        alwaysArray(responses).forEach(function (resp) {
            Object.keys(resp).forEach(function (actionName) {
                const item = resp[actionName];
                newResponses.onNext({
                    name: actionName,
                    path: [].concat(item.path).filter(Boolean),
                    targetName: item.action
                });
            });
        });
    }

    const api = {
        state$: state$,
        action$: action$,
        actionsWithState$: actionsWithState$,
        actionsWithResultingStateUpdate$: actionsWithState$,
        register: function (input) {
            const {state, reducers, effects, responses} = input;

            if (state) {
                _registerOnStateTree(state);
            }

            if (reducers) {
                _addReducers(reducers);
            }

            if (effects) {
                _addEffects(effects);
            }

            if (responses) {
                _addResponses(responses);
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
            const lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({}));
        },
        toJS: function (path) {
            const lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({})).toJS();
        },
        toJSON: function (path) {
            const lookup = alwaysArray(path);
            return state$.getValue().getIn(lookup, getMap({})).toJSON();
        },
        addMiddleware: function (middleware) {
            _addMiddleware(middleware);
            return api;
        },
        once: function (actions) {
            const lookup = alwaysArray(actions);
            return actionsWithState$.filter(x => {
                return lookup.indexOf(x.action.type) > -1;
            }).take(1);
        },
        changes: function (path) {
            const lookup = alwaysArray(path);
            return state$.map(x => x.getIn(lookup))
                .distinctUntilChanged();
        }
    };

    // add initial ones
    _addReducers(initialReducers);
    _addEffects(initialEffects);
    _addMiddleware(initialMiddleware);
    _addExtras(initialExtras);

    function alwaysMap (input) {
        return Immutable.Map.isMap(input) ? input : Immutable.fromJS(input || {})
    }

    function alwaysArray (input) {
        return [].concat(input).filter(Boolean)
    }

    function isPlainObject(value) {
        const objectTag = '[object Object]';

        return Object.prototype.toString.call(value) === objectTag;
    }

    function getMap(incoming) {
        return Immutable.Map(incoming);
    }

    return api;
}

export default createStore;

if (window && ((typeof window.staunch) === 'undefined')) {
    window.staunch = {
        createStore
    };
}
