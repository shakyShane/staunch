"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BehaviorSubject = require('rxjs/BehaviorSubject').BehaviorSubject;
var Subject = require('rxjs/subject').Subject;
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