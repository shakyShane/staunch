const { createStore } = require('../dist');
const Immutable = require('immutable');
const assert = require('chai').assert;
require('rxjs/add/operator/skip');

describe('api', function() {

    it('toJS() (full)', function () {
        const store = createStore({name: 'shane'});

        store.addReducers(function (state, action) {
            return state.set('name', 'kittie');
        });

        assert.deepEqual(store.dispatch({type: 'anything'}).toJS().name, 'kittie');
    });

    it('toJS() (path)', function () {
        const store = createStore({user: {name: 'shane'}});
        assert.deepEqual(store.toJS('user').name, 'shane')
    });

    it('toJSON() (full)', function () {
        const input    = {name: 'shane'};
        const store    = createStore(input);
        const expected = Immutable.fromJS(input).toJSON();
        const actual   = store.toJSON();
        assert.deepEqual(actual, expected);
    });

    it('toJSON() (path)', function () {
        const input    = {user: {name: 'shane'}};
        const store    = createStore(input);
        const expected = Immutable.fromJS(input.user).toJSON();
        const actual   = store.toJSON(['user']);
        assert.deepEqual(actual, expected);
    });

    it('addReducers() Add global reducer function with access to everything', function () {
        const store = createStore({user: {name: 'shane'}});

        const fn = function (state, action) {
            switch (action.type) {
                case 'USER_ID':
                    return state.setIn(['user', 'id'], action.payload);
            }
            return state;
        };

        const result = store.addReducers([fn])
            .dispatch({type: 'USER_ID', payload: '01'})
            .getState()
            .toJS();

        assert.deepEqual(result.user.id, '01');
    });


    it('addReducers() Add reducer function tied to a path (id) (name)', function () {

        const store = createStore({user: {name: 'shane'}});

        const fn2 = function (user, action) {
            switch (action.type) {
                case 'USER_ID':
                    return user.set('id', action.payload);
            }
            return user;
        };
        const fn3 = function (user, action) {
            switch (action.type) {
                case 'USER_NAME':
                    return user.set('name', action.payload);
            }
            return user;
        };

        const result = store.addReducers([{path: ['user'], fns: [fn2, fn3]}])
            .dispatch({type: 'USER_ID', payload: '01'})
            .dispatch({type: 'USER_NAME', payload: 'Shane'})
            .getState()
            .toJS();

        assert.deepEqual(result.user.id, '01');
        assert.deepEqual(result.user.name, 'Shane');
    });

    it('once() - can respond a maximum of 1 time to an action', function () {

        var calls = 0;

        const store = createStore({}, function (state) {
            return state;
        });

        store.once('anything')
            .subscribe(x => { calls++ });

        store
            .dispatch({type: 'anything'})
            .dispatch({type: 'anything'})
            .dispatch({type: 'anything'});

        assert.deepEqual(calls, 1);
    });

    it('has a change feed based on a path', function () {

        var calls = [];

        const initialState = {
            user: {
                name: "shane",
                id: null
            }
        };

        const store = createStore(initialState, function (state, action) {
            return state.setIn(['user', 'id'], action.payload);
        });

        store.changes(['user'])
            .subscribe(x => { calls.push(x) });

        store.dispatch({type: 'USER_ID', payload: '01'});

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[0].toJS().id, null);
        assert.deepEqual(calls[1].toJS().id, '01');
    });
})