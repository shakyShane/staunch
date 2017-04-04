"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = require("rx");
var BehaviorSubject = Rx.BehaviorSubject;
var Subject = Rx.Subject;
function getStoreReducers() {
    var storeReducers = new BehaviorSubject([]);
    var newReducer$ = new Subject();
    var subscription = newReducer$.scan(function (acc, incoming) {
        return acc.concat(incoming);
    }, []).subscribe(storeReducers);
    return {
        newReducer$: newReducer$,
        storeReducers: storeReducers,
        subscription: subscription
    };
}
exports.getStoreReducers = getStoreReducers;
exports.default = getStoreReducers;
//# sourceMappingURL=storeReducers.js.map