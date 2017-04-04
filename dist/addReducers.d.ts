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
export declare enum InputTypes {
    Reducer,
    MappedReducer,
    Effect,
    State,
}
export declare function gatherReducers(incoming: any): any;
