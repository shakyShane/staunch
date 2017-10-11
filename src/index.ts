import Immutable = require('immutable');
import {actionStream} from "./actions";
import {handleResponses} from "./responses";

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
import {StaunchStore, IStoreProps} from "./StaunchStore";

export enum ReducerTypes {
    MappedReducer = <any>'MappedReducer',
    GlobalReducer = <any>'GlobalReducer'
}

export function createStore(props: IStoreProps = {}): StaunchStore {

    const mergedInitialState = alwaysMap(props.state);
    const store = new StaunchStore({...props, state: mergedInitialState});

    const subs = [];

    // stream
    subs.push(
        actionStream(mergedInitialState, store.action$, store.storeReducers, store.mappedReducers)
            .subscribe(store.state$)
    );

    /**
     * Setup responses for declarative cross-domain communication
     */
    subs.push(handleResponses(store.actionsWithState$, store.storeResponses)
        .subscribe(action => store.dispatcher(action)));

    store.addReducers(props.reducers);
    store.addEffects(props.effects);
    store.addMiddleware(props.middleware);
    store.addExtras(props.extras);

    return store;
}

export function alwaysArray (input) {
    return [].concat(input).filter(Boolean)
}
export function getMap(incoming) {
    return Immutable.Map(incoming);
}

export function alwaysMap (input) {
    return Immutable.Map.isMap(input) ? input : Immutable.fromJS(input || {})
}

export function isPlainObject(value) {
    const objectTag = '[object Object]';

    return Object.prototype.toString.call(value) === objectTag;
}

export default createStore;

if ((typeof window !== 'undefined') && ((typeof window.staunch) === 'undefined')) {
    window.staunch = {
        createStore
    };
}

export {
    StaunchStore
};
