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
function addEffects(incoming, actionsWithState$, storeExtras, userExtra$, _dispatcher) {
    var actionsApi = {
        ofType: function (actionName) {
            return actionsWithState$.filter(function (incoming) {
                return incoming.action.type === actionName;
            });
        }
    };
    _addEffects(incoming);
    function _addEffects(effects) {
        var extras = Object.assign({}, storeExtras, userExtra$.getValue());
        index_1.alwaysArray(effects).forEach(function (effect) {
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
            effect.call(null, stream, extras)
                .map(function (action) {
                return __assign({}, action, { via: '[effect]', name: (effect.name || '') });
            })
                .forEach(function (action) {
                _dispatcher(action);
            });
        });
    }
}
exports.addEffects = addEffects;
//# sourceMappingURL=addEffects.js.map