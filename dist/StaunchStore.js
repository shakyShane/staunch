"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
var Subject_1 = require("rxjs/Subject");
var subjects_1 = require("./subjects");
var addEffects_1 = require("./addEffects");
var addReducers_1 = require("./addReducers");
var StaunchStore = (function () {
    function StaunchStore(props) {
        this.isOpen = true;
        this.state$ = new BehaviorSubject_1.BehaviorSubject(props.state);
        this.subs = [];
        this.userExtra$ = new BehaviorSubject_1.BehaviorSubject({});
        this.newExtras$ = new Subject_1.Subject();
        this.subs.push(this.newExtras$.scan(subjects_1.assignFn, {}).subscribe(this.userExtra$));
        // reducers to act upon state
        this.storeReducers = new BehaviorSubject_1.BehaviorSubject([]);
        this.newReducer$ = new Subject_1.Subject();
        this.subs.push(this.newReducer$.scan(subjects_1.concatFn, []).subscribe(this.storeReducers));
        // Mapped reducers
        this.mappedReducers = new BehaviorSubject_1.BehaviorSubject([]);
        this.newMappedReducer$ = new Subject_1.Subject();
        this.subs.push(this.newMappedReducer$.scan(subjects_1.concatFn, []).subscribe(this.mappedReducers));
        // responses
        this.storeResponses = new BehaviorSubject_1.BehaviorSubject([]);
        this.newResponses = new Subject_1.Subject();
        this.subs.push(this.newResponses.scan(subjects_1.concatFn, []).subscribe(this.storeResponses));
        // stream of actions
        this.action$ = new Subject_1.Subject();
        this.actionsWithState$ = this.action$.withLatestFrom(this.state$, function (action, state) {
            return {
                action: action,
                state: state
            };
        });
        this.actionsWithResultingStateUpdate$ = this.actionsWithState$;
        this.postDispatchFns = [].concat(props.postDispatch).filter(Boolean);
    }
    StaunchStore.prototype.register = function (input) {
        var state = input.state, reducers = input.reducers, effects = input.effects, responses = input.responses, extras = input.extras;
        if (state) {
            this._registerOnStateTree(state);
        }
        if (reducers) {
            this._addReducers(reducers);
        }
        if (extras) {
            this._addExtras(extras);
        }
        if (effects) {
            this._addEffects(effects);
        }
        if (responses) {
            this._addResponses(responses);
        }
        return this;
    };
    StaunchStore.prototype._registerOnStateTree = function (state) {
        for (var key in state) {
            // now init with action
            this.dispatcher({
                type: '@@NS-INIT(' + key + ')',
                payload: {
                    path: [key],
                    value: state[key]
                }
            });
        }
    };
    StaunchStore.prototype._addExtras = function (extras) {
        var _this = this;
        index_1.alwaysArray(extras).forEach(function (extra) {
            _this.newExtras$.next(extra);
        });
    };
    StaunchStore.prototype._addResponses = function (responses) {
        var _this = this;
        index_1.alwaysArray(responses).forEach(function (resp) {
            Object.keys(resp).forEach(function (actionName) {
                var item = resp[actionName];
                _this.newResponses.next({
                    name: actionName,
                    path: [].concat(item.path).filter(Boolean),
                    targetName: item.action
                });
            });
        });
    };
    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    StaunchStore.prototype.dispatcher = function (action) {
        var _this = this;
        if (!this.isOpen) {
            return;
        }
        if (Array.isArray(action)) {
            action.forEach(function (a) {
                _this.action$.next(a);
            });
        }
        else {
            this.action$.next(action);
        }
        if (this.postDispatchFns.length) {
            this.postDispatchFns.forEach(function (fn) { return fn(action); });
        }
    };
    StaunchStore.prototype._addMiddleware = function (middleware) {
        var _this = this;
        index_1.alwaysArray(middleware).forEach(function (middleware) {
            middleware.call(null, _this);
        });
    };
    StaunchStore.prototype._addEffects = function (incoming) {
        var _this = this;
        /**
         * Default extras that get passed to all 'effects'
         */
        var storeExtras = {
            state$: this.state$,
            action$: this.action$,
            actionsWithState$: this.actionsWithState$,
            actionsWithResultingStateUpdate$: this.actionsWithState$
        };
        addEffects_1.gatherEffects(incoming, this.actionsWithState$, storeExtras, this.userExtra$)
            .forEach(function (outgoing) {
            if (outgoing.type === addReducers_1.InputTypes.Effect) {
                _this.subs.push(outgoing.payload.subscribe(_this.dispatcher.bind(_this)));
            }
        });
    };
    StaunchStore.prototype._addReducers = function (incoming) {
        var _this = this;
        addReducers_1.gatherReducers(incoming)
            .forEach(function (outgoing) {
            if (outgoing.type === addReducers_1.InputTypes.Reducer) {
                _this.newReducer$.next(outgoing.payload);
            }
            if (outgoing.type === addReducers_1.InputTypes.MappedReducer) {
                _this.newMappedReducer$.next(outgoing.payload);
            }
            if (outgoing.type === addReducers_1.InputTypes.State) {
                _this._registerOnStateTree(outgoing.payload);
            }
        });
    };
    StaunchStore.prototype.addReducers = function (reducers) {
        this._addReducers(reducers);
        return this;
    };
    StaunchStore.prototype.dispatch = function (action) {
        this.dispatcher(action);
        return this;
    };
    StaunchStore.prototype.getState = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({}));
    };
    StaunchStore.prototype.toJS = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({})).toJS();
    };
    StaunchStore.prototype.toJSON = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.getValue().getIn(lookup, index_1.getMap({})).toJSON();
    };
    StaunchStore.prototype.addMiddleware = function (middleware) {
        this._addMiddleware(middleware);
        return this;
    };
    StaunchStore.prototype.changes = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.state$.map(function (x) { return x.getIn(lookup); })
            .distinctUntilChanged();
    };
    StaunchStore.prototype.once = function (actions) {
        var lookup = index_1.alwaysArray(actions);
        return this.actionsWithState$.filter(function (x) {
            return lookup.indexOf(x.action.type) > -1;
        }).take(1);
    };
    StaunchStore.prototype.addExtras = function (extras) {
        this._addExtras(extras);
        return this;
    };
    StaunchStore.prototype.addEffects = function (effects) {
        this._addEffects(effects);
        return this;
    };
    StaunchStore.prototype.close = function () {
        if (this.isOpen) {
            this.subs.forEach(function (sub) { return sub.unsubscribe(); });
            this.isOpen = false;
        }
        return this;
    };
    StaunchStore.prototype.ofType = function (path) {
        var lookup = index_1.alwaysArray(path);
        return this.actionsWithState$
            .filter(function (_a) {
            var action = _a.action;
            return lookup.indexOf(action.type) > -1;
        });
    };
    return StaunchStore;
}());
exports.StaunchStore = StaunchStore;
//# sourceMappingURL=StaunchStore.js.map