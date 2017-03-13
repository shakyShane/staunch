const createStore = require('../');
const assert = require('assert');

(function () {
    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: [
            function (user) {
                return user.set('id', '01');
            }
        ]
    })
        .dispatch({type: 'anything'})
        .getState()
        .toJS();

    assert.equal(result.user.id, '01', 'Action fires from an object only');
})();

(function () {
    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: [
            function (user) {
                return user.set('id', '01');
            }
        ]
    })
        .dispatch('anything')
        .getState()
        .toJS();

    assert.equal(result.user.id, '01', 'Action fires from a string only');
})();


(function () {
    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: [
            function (user, action) {
                switch (action.type) {
                    case 'USER_ID':
                        return user.set('id', action.payload);
                    case 'USER_NAME':
                        return user.set('name', action.payload)
                }
                return user;
            }
        ]
    })
        .dispatch({type: 'USER_ID', payload: '01'})
        .dispatch({type: 'USER_NAME', payload: 'Shane'})
        .getState()
        .toJS();

    assert.equal(result.user.id, '01', 'Action fires from multiple (set id)');
    assert.equal(result.user.name, 'Shane', 'Action fires from multiple (set name)');
})();


(function () {
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

    assert.equal(result.user.id, '01', 'Add global reducer function with access to everything');
})();


(function () {
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

    assert.equal(result.user.id, '01', 'Add reducer function tied to a path (id)');
    assert.equal(result.user.name, 'Shane', 'Add reducer function tied to a path (name)');
})();

(function () {

    const fn2 = function (state, action) {
        switch (action.type) {
            case 'USER_ID':
                return state.setIn(['user', 'id'], action.payload);
        }
        return state;
    };

    const store = createStore({user: {name: 'shane'}}, fn2);

    store.action$.subscribe(function (action) {
        assert.equal(action.type, 'USER_ID', 'action has type');
        assert.equal(action.payload, '01', 'action has payload');
    });

    const result = store.dispatch({type: 'USER_ID', payload: '01'}).getState().toJS();
    assert.equal(result.user.id, '01', 'Add reducer function tied to a path (id)');
})();


(function () {

    const fn2 = function (state, action) {
        switch (action.type) {
            case 'USER_ID':
                return state.setIn(['user', 'id'], action.payload);
        }
        return state;
    };

    const store = createStore({user: {name: 'shane'}}, fn2);

    store.actionsWithState$.subscribe(function (incoming) {
        assert.equal(incoming.action.type, 'USER_ID', 'action has type');
        assert.equal(incoming.action.payload, '01', 'action has payload');
    });

    const result = store.dispatch({type: 'USER_ID', payload: '01'}).getState().toJS();
    assert.equal(result.user.id, '01', 'Add reducer function tied to a path (id)');

})();