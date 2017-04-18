import Immutable = require('immutable');
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/of';
export declare enum ReducerTypes {
    MappedReducer,
    GlobalReducer,
}
export declare function createStore(initialState: any, initialReducers: any, initialEffects: any, initialMiddleware: any, initialExtras: any): {
    isOpen: boolean;
    state$: BehaviorSubject<any>;
    action$: Subject<{}>;
    actionsWithState$: Observable<{
        action: {};
        state: any;
    }>;
    actionsWithResultingStateUpdate$: Observable<{
        action: {};
        state: any;
    }>;
    register: (input: any) => any;
    addReducers: (reducers: any) => any;
    dispatch: (action: any) => any;
    getState: (path: any) => any;
    toJS: (path: any) => any;
    toJSON: (path: any) => any;
    addMiddleware: (middleware: any) => any;
    once: (actions: any) => Observable<{
        action: any;
    }>;
    changes: (path: any) => Observable<any>;
    addExtras: (extras: any) => any;
    close: () => any;
};
export declare function alwaysArray(input: any): any[];
export declare function getMap(incoming: any): Immutable.Map<{}, {}>;
export declare function alwaysMap(input: any): any;
export declare function isPlainObject(value: any): boolean;
export default createStore;
