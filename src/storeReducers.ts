import Immutable = require('immutable');
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

export function getStoreReducers() {

    const storeReducers = new BehaviorSubject([]);
    const newReducer$ = new Subject();
    const subscription = newReducer$.scan(function (acc:any, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(storeReducers);

    return {
        newReducer$,
        storeReducers,
        subscription
    }
}

export default getStoreReducers;
