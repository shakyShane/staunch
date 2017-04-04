import {alwaysArray, isPlainObject, ReducerTypes} from "./index";
/**
 * Add either plain functions or {path, fns} pairs
 * @param reducers
 * outputTypes:
 * @private
 */
export function addReducers (incoming, newReducer$, newMappedReducer$, _addEffects, _registerOnStateTree) {

    _addReducers(incoming);

    function _addReducers(reducers) {

        alwaysArray(reducers).forEach(function (reducer) {

            if (typeof reducer === 'function') {
                return newReducer$.onNext({
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
}