import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/mergeMap';

import {getMap} from "./index";

export function handleResponses (actionsWithState$, storeResponses) {
    /**
     * Setup responses for declarative cross-domain communication
     */
    return actionsWithState$
        .withLatestFrom(storeResponses)
        .filter(([_, storeResponses]) => storeResponses.length > 0)
        .flatMap(incoming => {
            const {action, state}   = incoming[0];
            const storeResponses    = incoming[1];
            const actionName        = action.type;

            const matchingResponses = storeResponses
                .filter(response => response.name === actionName);

            const newActions = matchingResponses.map(x => {
                return {
                    type: x.targetName,
                    payload: state.getIn(x.path, getMap({})).toJS(),
                    via: `[response to (${actionName})]`
                }
            });

            return Observable.of(newActions);
        })
}