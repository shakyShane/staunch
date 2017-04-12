"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = require("rx");
var _a = Rx.Observable, empty = _a.empty, of = _a.of;
// A mailbox knows how to map incoming messages
// onto sync/async methods
function createMailbox(actor) {
    var sub = new Rx.Subject();
    var outgoing = sub.flatMap(function (x) {
        var _a = x.action.type.split('.'), _ = _a[0], method = _a[1];
        var methodMatch = actor.methods ? actor.methods[method] : null;
        var effectMatch = actor.effects ? actor.effects[method] : null;
        if (methodMatch) {
            var response = methodMatch.call(null, x.action.payload, x);
            return of({
                response: response,
                respId: x.id
            });
        }
        if (effectMatch) {
            return effectMatch
                .call(null, x.action.payload, x)
                .map(function (output) {
                return {
                    response: output,
                    respId: x.id
                };
            });
        }
        return empty();
    }).share();
    return { outgoing: outgoing, incoming: sub };
}
exports.createMailbox = createMailbox;
//# sourceMappingURL=createMailbox.js.map