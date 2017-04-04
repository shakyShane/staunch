import Rx = require('rx');
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

            return Rx.Observable.from(newActions);
        })
}