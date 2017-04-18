import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
export declare function getStoreReducers(): {
    newReducer$: Subject<{}>;
    storeReducers: BehaviorSubject<any[]>;
    subscription: Subscription;
};
export default getStoreReducers;
