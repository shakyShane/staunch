import Immutable = require('immutable');
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
import { StaunchStore, IStoreProps } from "./StaunchStore";
export declare enum ReducerTypes {
    MappedReducer,
    GlobalReducer,
}
export declare function createStore(props?: IStoreProps): StaunchStore;
export declare function alwaysArray(input: any): any[];
export declare function getMap(incoming: any): Immutable.Map<{}, {}>;
export declare function alwaysMap(input: any): any;
export declare function isPlainObject(value: any): boolean;
export default createStore;
export { StaunchStore };
