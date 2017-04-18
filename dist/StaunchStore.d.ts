import { Map } from 'immutable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable, Subscription } from "rxjs";
export interface IStoreProps {
    state?: any;
    reducers?: any[];
    effects?: any[];
    middleware?: Function[];
    extras?: any;
}
export interface IAction {
    type: string;
    payload?: any;
    via?: any;
    error?: boolean;
    meta?: any;
}
export interface IActionWithState {
    action: IAction;
    state: Map<string, any>;
}
export declare class StaunchStore {
    action$: Subject<IAction>;
    newExtras$: Subject<any>;
    userExtra$: Subject<any>;
    newResponses: Subject<any>;
    newReducer$: Subject<any>;
    newMappedReducer$: Subject<any>;
    storeReducers: BehaviorSubject<any>;
    state$: BehaviorSubject<Map<string, any>>;
    mappedReducers: BehaviorSubject<any>;
    storeResponses: BehaviorSubject<any>;
    subs: Subscription[];
    actionsWithState$: Observable<IActionWithState>;
    actionsWithResultingStateUpdate$: Observable<IActionWithState>;
    isOpen: boolean;
    constructor(props: IStoreProps);
    register(input: any): this;
    private _registerOnStateTree(state);
    private _addExtras(extras);
    private _addResponses(responses);
    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    dispatcher(action: any): void;
    private _addMiddleware(middleware);
    private _addEffects(incoming);
    private _addReducers(incoming);
    addReducers(reducers: any): this;
    dispatch(action: IAction): this;
    getState(path?: string | string[]): any;
    toJS(path?: string | string[]): any;
    toJSON(path?: string | string[]): any;
    addMiddleware(middleware: any): this;
    changes(path?: string | string[]): Observable<any>;
    once(actions: string | string[]): Observable<IActionWithState>;
    addExtras(extras: any): this;
    addEffects(effects: any): this;
    close(): this;
    ofType(path?: string | string[]): Observable<IActionWithState>;
}
