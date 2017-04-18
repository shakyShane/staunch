import Immutable = require('immutable');
const BehaviorSubject = require('rxjs/BehaviorSubject').BehaviorSubject;
const Subject = require('rxjs/subject').Subject;

export function getStoreReducers() {

    const storeReducers = new BehaviorSubject([]);
    const newReducer$ = new Subject();
    const subscription = newReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(storeReducers);

    return {
        newReducer$,
        storeReducers,
        subscription
    }
}

export default getStoreReducers;