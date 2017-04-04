"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var addReducers_1 = require("./addReducers");
function gatherEffects(incoming, actionsWithState$, storeExtras, userExtra$) {
    var actionsApi = {
        ofType: function (actionName) {
            return actionsWithState$.filter(function (incoming) {
                return incoming.action.type === actionName;
            });
        }
    };
    var extras = Object.assign({}, storeExtras, userExtra$.getValue());
    return index_1.alwaysArray(incoming).reduce(function (acc, effect) {
        if (typeof effect !== 'function') {
            console.error('Effects must be functions, you provided', effect);
        }
        var stream = (function () {
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
        var effectOutput = effect.call(null, stream, extras);
        return acc.concat({
            type: addReducers_1.InputTypes.Effect,
            payload: effectOutput.map(function (action) {
                return __assign({}, action, { via: '[effect]', name: (effect.name || '') });
            })
        });
    }, []);
}
exports.gatherEffects = gatherEffects;
//# sourceMappingURL=addEffects.js.map