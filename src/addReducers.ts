import {alwaysArray, isPlainObject, ReducerTypes} from "./index";
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
export enum InputTypes {
    Reducer = <any>'Reducer',
    MappedReducer = <any>'MappedReducers',
    Effect = <any>'Effect',
    State = <any>'State',
}
export function gatherReducers(incoming) {

    return _addReducers(incoming, []);

    function _addReducers(reducers, initial) {

        return alwaysArray(reducers).reduce(function (acc, reducer) {

            if (typeof reducer === 'function') {
                return acc.concat({
                    type: InputTypes.Reducer,
                    payload: {
                        path: [],
                        fns: [reducer]
                    }
                });
            }

            if (isPlainObject(reducer)) {
                if (reducer.state) {
                    let reducers, state, effects;
                    if (reducer.reducers) {

                        /**
                         * if 'state' and 'reducers' key were found,
                         * we bind the reducers to that top-level state key
                         */
                        reducers = Object.keys(reducer.state).reduce(function (acc, stateKey) {
                            return acc.concat(_addReducers({path: stateKey,  fns: reducer.reducers}, []));
                        }, []);
                    }
                    if (reducer.effects) {
                        effects = reducer.effects;
                    }
                    /**
                     *
                     */
                    state = reducer.state;

                    return acc.concat(
                        reducers,
                        {
                            type: InputTypes.Effect,
                            payload: effects
                        },
                        {
                            type: InputTypes.State,
                            payload: state
                        }
                    )
                }
                if (reducer.path && reducer.reducers) {
                    const maps = Object.keys(reducer.reducers).reduce(function (acc, name) {
                        const currentFn = reducer.reducers[name];
                        return acc.concat({
                            type: InputTypes.MappedReducer,
                            payload: {
                                path: [].concat(reducer.path),
                                fns: [currentFn],
                                name,
                                type: ReducerTypes.MappedReducer
                            }
                        })
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
                } else {
                    // redux style key: fn pairs
                    const outgoing = Object.keys(reducer).reduce(function(acc, key) {
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