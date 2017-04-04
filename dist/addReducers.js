"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
/**
 * Add either plain functions or {path, fns} pairs
 * @param reducers
 * outputTypes:
 * @private
 */
function addReducers(incoming, newReducer$, newMappedReducer$, _addEffects, _registerOnStateTree) {
    _addReducers(incoming);
    function _addReducers(reducers) {
        index_1.alwaysArray(reducers).forEach(function (reducer) {
            if (typeof reducer === 'function') {
                return newReducer$.onNext({
                    path: [],
                    fns: [].concat(reducer).filter(Boolean)
                });
            }
            if (index_1.isPlainObject(reducer)) {
                if (reducer.state) {
                    if (reducer.reducers) {
                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        Object.keys(reducer.state).forEach(function (stateKey) {
                            _addReducers({ path: stateKey, fns: reducer.reducers });
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
                        var currentFn = reducer.reducers[name];
                        newMappedReducer$.onNext({
                            path: [].concat(reducer.path),
                            fns: [currentFn],
                            name: name,
                            type: index_1.ReducerTypes.MappedReducer
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
                }
                else {
                    // redux style key: fn pairs
                    for (var key in reducer) {
                        newReducer$.onNext({
                            path: [].concat(key).filter(Boolean),
                            fns: [].concat(reducer[key]).filter(Boolean)
                        });
                    }
                }
            }
        });
    }
}
exports.addReducers = addReducers;
//# sourceMappingURL=addReducers.js.map