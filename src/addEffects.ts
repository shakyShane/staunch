import {alwaysArray} from "./index";

export function addEffects(incoming, actionsWithState$, storeExtras, userExtra$, _dispatcher) {

    const actionsApi = {
        ofType: function (actionName) {
            return actionsWithState$.filter(function (incoming) {
                return incoming.action.type === actionName;
            });
        }
    };

    _addEffects(incoming)


    function _addEffects (effects) {

        const extras = Object.assign({}, storeExtras, userExtra$.getValue());

        alwaysArray(effects).forEach(function (effect) {

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


            effect.call(null, stream, extras)
            // Make it clear where this action originated from
                .map(action => {
                    return {
                        ...action,
                        via: '[effect]',
                        name: (effect.name || '')
                    }
                })
                .forEach(function (action) {
                    _dispatcher(action);
                });
        });
    }
}