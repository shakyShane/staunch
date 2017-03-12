var Observable      = require('rxjs/Observable').Observable;
var BehaviorSubject = require('rxjs/BehaviorSubject').BehaviorSubject;
var Subject         = require('rxjs/Subject').Subject;
require('rxjs/add/operator/scan');
require('rxjs/add/operator/do');
require('rxjs/add/operator/share');
require('rxjs/add/operator/withLatestFrom');

var Immutable       = require('immutable');
var fromJS          = Immutable.fromJS;
var Map             = Immutable.Map;

module.exports = function createStore(initialState, initialReducers) {

    var mergedInitialState = alwaysMap(initialState);

    var state$ = new BehaviorSubject(mergedInitialState);

    // stream of actions
    var action$ = new Subject();

    // reducers to act upon state
    var storeReducers = [];

    // add initial ones
    _addReducers(initialReducers);

    // stream
    var stateUpdate$ = action$.scan(function(accMap, action) {

        // is it a @@namespace ?
        var actionType = action.type || (typeof action === 'string' ? action : '');

        if (actionType.indexOf('@@NS-INIT') === 0) {

            return accMap.setIn(action.payload.path, alwaysMap((action.payload || {}).value))

        } else {
            return storeReducers.reduce(function (outgoingValue, reducer) {
                return outgoingValue.updateIn(reducer.path, function(currentValue) {
                    return reducer.fns.reduce(function (value, fn) {
                        return fn.call(null, value, action, outgoingValue);
                    }, currentValue)
                });
            }, accMap);
        }
    }, mergedInitialState).share();

    // Push all state updates back onto state$ value
    stateUpdate$
        .subscribe(state$);

    /**
     * Dispatch 1 or many actions
     * @param action
     * @returns {*}
     * @private
     */
    function _dispatcher(action) {
        if (Array.isArray(action)) {
            return action.forEach(function(a) { action$.next(a) });
        }
        return action$.next(action);
    }

    /**
     * Add either plain functions or {path, fns} pairs
     * @param reducers
     * @private
     */
    function _addReducers (reducers) {
        [].concat(reducers).filter(Boolean).forEach(function (r) {
            if (typeof r === 'function') {
                storeReducers.push({
                    path: [],
                    fns: [].concat(r).filter(Boolean)
                });
            }
            if (r.path && r.fns) {
                storeReducers.push({
                    path: [].concat(r.path).filter(Boolean),
                    fns: [].concat(r.fns).filter(Boolean)
                });
            }
        });
    }

    var api = {
        state$: state$,
        action$: action$,
        actionsWithState$: action$.withLatestFrom(state$, function (action, state) { return {action: action, state: state} }),
        register: function (input) {
            var state    = input.state;
            var reducers = input.reducers;
            var effects  = input.effects;
            for (var key in state) {
                storeReducers.push({
                    path: [key],
                    fns: [].concat(reducers).filter(Boolean)
                });
                // now init with action
                _dispatcher({
                    type: '@@NS-INIT('+ key +')',
                    payload: {
                        path: [key],
                        value: state[key]
                    }
                });
            }
            return api;
        },
        addReducers: function (reducers) {
            _addReducers(reducers);
            return api;
        },
        dispatch: function (action) {
            _dispatcher(action);
            return api;
        },
        getState: function (path) {
            var lookup = [].concat(path).filter(Boolean);
            return state$.getValue().getIn(lookup, Map({}));
        },
        toJS: function () {
            return state$.getValue().toJS();
        }
    };

    return api;
};

function alwaysMap (input) { return Map.isMap(input) ? input : fromJS(input || {}) };