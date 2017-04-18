import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/of';
import Immutable = require('immutable');
export declare enum ReducerTypes {
    MappedReducer,
    GlobalReducer,
}
export declare function createStore(initialState: object, initialReducers: any, initialEffects: any, initialMiddleware: any, initialExtras: any): {
    isOpen: boolean;
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
    addExtras: (extras: any) => any;
    close: () => any;
};
export declare function alwaysArray(input: any): any[];
export declare function getMap(incoming: any): Immutable.Map<{}, {}>;
export declare function alwaysMap(input: any): any;
export declare function isPlainObject(value: any): boolean;
export default createStore;
