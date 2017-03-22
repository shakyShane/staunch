export interface IAction {
    type: string;
    payload?: any;
    via?: string;
}
export declare enum ReducerTypes {
    MappedReducer,
    GlobalReducer,
}
export declare function createStore(initialState: object, initialReducers: any, initialEffects: any, initialMiddleware: any, initialExtras: any): {
    state$: any;
    action$: any;
    actionsWithState$: any;
    actionsWithResultingStateUpdate$: any;
    register: (input: any) => any;
    addReducers: (reducers: any) => any;
    dispatch: (action: any) => any;
    getState: (path: any) => any;
    toJS: (path: any) => any;
    toJSON: (path: any) => any;
    addMiddleware: (middleware: any) => any;
    once: (actions: any) => any;
    changes: (path: any) => any;
};
export default createStore;
