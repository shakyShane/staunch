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
//# sourceMappingURL=addReducers.js.map