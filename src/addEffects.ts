import {alwaysArray} from "./index";
import {InputTypes} from "./addReducers";

export function gatherEffects(incoming, actionsWithState$, storeExtras, userExtra$) {

    const actionsApi = {
        ofType: function (actionName) {
            return actionsWithState$.filter(function (incoming) {
                return incoming.action.type === actionName;
            });
        }
    };

    const extras = Object.assign({}, storeExtras, userExtra$.getValue());

    return alwaysArray(incoming).reduce(function (acc, effect) {

        if (typeof effect !== 'function') {
            console.error('Effects must be functions, you provided', effect);
        }

        const stream = (function () {

            if (effect.triggers && Array.isArray(effect.triggers)) {
                return actionsWithState$.filter(function (incoming) {
                    return ~effect.triggers.indexOf(incoming.action.type);
                });
            }

            if (effect.trigger && typeof effect.trigger === 'string') {
                return actionsWithState$.filter(function (incoming) {
                    return effect.trigger === incoming.action.type;
                });
            }

            return actionsApi;
        })();

        // todo, verify the output of this ie: ensure an observable
        // was returned
        const effectOutput = effect.call(null, stream, extras)

        return acc.concat({
            type: InputTypes.Effect,
            payload: effectOutput.map(action => {
                return {
                    ...action,
                    via: '[effect]',
                    name: (effect.name || '')
                }
            })
        });
    }, []);
}