import {ReducerTypes, alwaysMap, isPlainObject} from "./index";

export function actionStream<T> (intialState: T, action$, storeReducers, mappedReducers): T {
    return action$
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

        }, intialState)
}