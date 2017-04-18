"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
var Subject_1 = require("rxjs/Subject");
function getStoreReducers() {
    var storeReducers = new BehaviorSubject_1.BehaviorSubject([]);
    var newReducer$ = new Subject_1.Subject();
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