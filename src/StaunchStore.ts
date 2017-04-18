import {alwaysArray, alwaysMap, getMap} from "./index";
import {Map} from 'immutable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {assignFn, concatFn} from "./subjects";
import {Observable, Subscription} from "rxjs";
import {gatherEffects} from "./addEffects";
import {gatherReducers, InputTypes} from "./addReducers";

export interface IStoreProps {
    state?: any
    reducers?: any[]
    effects?: any[]
    middleware?: Function[]
    extras?: any
}

export interface IAction {
    type: string
    payload?: any
    via?: any
    error?: boolean
    meta?: any
}

export interface IActionWithState {
    action: IAction
    state: Map<string, any>
}

export class StaunchStore {
    public action$: Subject<IAction>;
    public newExtras$: Subject<any>;
    public userExtra$: Subject<any>;
    public newResponses: Subject<any>;
    public newReducer$: Subject<any>;
    public newMappedReducer$: Subject<any>;
    public storeReducers: BehaviorSubject<any>;
    public state$: BehaviorSubject<Map<string, any>>;
    public mappedReducers: BehaviorSubject<any>;
    public storeResponses: BehaviorSubject<any>;
    public subs: Subscription[];
    public actionsWithState$: Observable<IActionWithState>;
    public actionsWithResultingStateUpdate$: Observable<IActionWithState>;

    isOpen = true;

    constructor(props: IStoreProps) {

        this.state$ = new BehaviorSubject(props.state);
        this.subs   = [];

        this.userExtra$ = new BehaviorSubject({});
        this.newExtras$ = new Subject();
        this.subs.push(this.newExtras$.scan(assignFn, {}).subscribe(this.userExtra$));

        // reducers to act upon state
        this.storeReducers = new BehaviorSubject([]);
        this.newReducer$ = new Subject();
        this.subs.push(this.newReducer$.scan(concatFn, []).subscribe(this.storeReducers));

        // Mapped reducers
        this.mappedReducers = new BehaviorSubject([]);
        this.newMappedReducer$ = new Subject();
        this.subs.push(this.newMappedReducer$.scan(concatFn, []).subscribe(this.mappedReducers));

        // responses
        this.storeResponses = new BehaviorSubject([]);
        this.newResponses = new Subject();
        this.subs.push(this.newResponses.scan(concatFn, []).subscribe(this.storeResponses));

        // stream of actions
        this.action$ = new Subject();

        this.actionsWithState$ = this.action$.withLatestFrom(this.state$, function (action, state) {
            return {
                action,
                state
            }
        });
        this.actionsWithResultingStateUpdate$ = this.actionsWithState$;
    }

    register(input) {
        const {state, reducers, effects, responses} = input;

        if (state) {
            this._registerOnStateTree(state);
        }

        if (reducers) {
            this._addReducers(reducers);
        }

        if (effects) {
            this._addEffects(effects);
        }

        if (responses) {
            this._addResponses(responses);
        }

        return this;
    }

    private _registerOnStateTree(state) {
        for (let key in state) {
            // now init with action
            this.dispatcher({
                type: '@@NS-INIT('+ key +')',
                payload: {
                    path: [key],
                    value: state[key]
                }
            });
        }
    }

    private _addExtras(extras) {
        alwaysArray(extras).forEach((extra) => {
            this.newExtras$.next(extra);
        });
    }

    private _addResponses (responses) {
        alwaysArray(responses).forEach((resp) => {
            Object.keys(resp).forEach((actionName) => {
                const item = resp[actionName];
                this.newResponses.next({
                    name: actionName,
                    path: [].concat(item.path).filter(Boolean),
                    targetName: item.action
                });
            });
        });
    }
    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    public dispatcher(action) {
        if (!this.isOpen) {
            return;
        }
        if (Array.isArray(action)) {
            return action.forEach((a) => {
                this.action$.next(a)
            });
        }
        return this.action$.next(action);
    }

    private _addMiddleware(middleware) {
        alwaysArray(middleware).forEach((middleware) => {
            middleware.call(null, this);
        })
    }

    private _addEffects(incoming) {
        /**
         * Default extras that get passed to all 'effects'
         */
        const storeExtras = {
            state$: this.state$,
            action$: this.action$,
            actionsWithState$: this.actionsWithState$,
            actionsWithResultingStateUpdate$: this.actionsWithState$
        };

        gatherEffects(incoming, this.actionsWithState$, storeExtras, this.userExtra$)
            .forEach(outgoing => {
                if (outgoing.type === InputTypes.Effect) {
                    this.subs.push(outgoing.payload.subscribe(this.dispatcher.bind(this)));
                }
            });
    }

    private _addReducers(incoming) {
        gatherReducers(incoming)
            .forEach(outgoing => {
                if (outgoing.type === InputTypes.Reducer) {
                    this.newReducer$.next(outgoing.payload);
                }
                if (outgoing.type === InputTypes.MappedReducer) {
                    this.newMappedReducer$.next(outgoing.payload);
                }
                if (outgoing.type === InputTypes.State) {
                    this._registerOnStateTree(outgoing.payload);
                }
            })
    }
    public addReducers (reducers) {
        this._addReducers(reducers);
        return this;
    }
    public dispatch (action: IAction) {
        this.dispatcher(action);
        return this;
    }
    public getState(path?: string|string[]) {
        const lookup = alwaysArray(path);
        return this.state$.getValue().getIn(lookup, getMap({}));
    }
    public toJS(path?: string|string[]) {
        const lookup = alwaysArray(path);
        return this.state$.getValue().getIn(lookup, getMap({})).toJS();
    }
    public toJSON(path?: string|string[]) {
        const lookup = alwaysArray(path);
        return this.state$.getValue().getIn(lookup, getMap({})).toJSON();
    }
    public addMiddleware(middleware) {
        this._addMiddleware(middleware);
        return this;
    }
    public changes(path?: string|string[]) {
        const lookup = alwaysArray(path);
        return this.state$.map(x => x.getIn(lookup))
            .distinctUntilChanged();
    }
    public once(actions: string|string[]) {
        const lookup = alwaysArray(actions);
        return this.actionsWithState$.filter((x: {action: any}) => {
            return lookup.indexOf(x.action.type) > -1;
        }).take(1);
    }
    public addExtras(extras) {
        this._addExtras(extras);
        return this;
    }
    public addEffects(effects) {
        this._addEffects(effects);
        return this;
    }
    public close() {
        if (this.isOpen) {
            this.subs.forEach(sub => sub.unsubscribe());
            this.isOpen = false;
        }
        return this;
    }
}
