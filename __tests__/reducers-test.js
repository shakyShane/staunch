const createStore = require('../src');
const assert = require('assert');

it('Action fires from an object only', function () {

    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: {
            user: function (user) {
                return user.set('id', '01');
            }
        }
    })
        .dispatch({type: 'anything'})
        .getState()
        .toJS();

    assert.equal(result.user.id, '01', 'Action fires from an object only');
});

it('Action fires from a string only', function () {

    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: [
            function (state) {
                return state.setIn(['user', 'id'], '01');
            }
        ]
    })
        .dispatch({type: 'anything'})
        .getState()
        .toJS();

    expect(result.user.id).toEqual('01');
});


it('Action fires from multiple', function () {

    const store = createStore();
    const result = store.register({
        state: {
            user: {
                name: 'shane'
            }
        },
        reducers: {
            user: function (user, action) {
                switch (action.type) {
                    case 'USER_ID':
                        return user.set('id', action.payload);
                    case 'USER_NAME':
                        return user.set('name', action.payload)
                }
                return user;
            }
        }
    })
        .dispatch({type: 'USER_ID', payload: '01'})
        .dispatch({type: 'USER_NAME', payload: 'Shane'})
        .getState()
        .toJS();

    assert.equal(result.user.id, '01', 'Action fires from multiple (set id)');
    assert.equal(result.user.name, 'Shane', 'Action fires from multiple (set name)');
});

it('Add reducer function tied to a path (id)', function () {

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
});

it('Add reducer function tied to a path (id)', function () {

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
});

it('Add reducer with direct action -> fn mapping', function () {

    const mappedReducers = [
        {
            path: ['user'],
            reducers: {
                ['USER_ID']: function (user, action) {
                    return user.set('id', action.payload);
                },
                ['USER_LOGOUT']: function (user, action) {
                    return user.set('id', action.payload);
                },
            }
        },
        {
            path: ['global'],
            reducers: {
                ['USER_ID']: function (global, action) {
                    return global.set('user', {id: action.payload});
                }
            }
        }
    ];

    const store = createStore({
        user: {name: 'shane'},
        global: {}
    }, mappedReducers);

    store.actionsWithState$.subscribe(function (incoming) {
        assert.equal(incoming.action.type, 'USER_ID', 'action has type');
        assert.equal(incoming.action.payload, '01', 'action has payload');
    });

    const result = store.dispatch({type: 'USER_ID', payload: '01'}).toJS();
    expect(result.global.user.id).toEqual('01');
});

it('Add reducer with direct action -> fn mapping at register point', function () {

    const mappedReducers = [
        {
            path: ['user'],
            reducers: {
                ['USER_ID']: function (user, action) {
                    return user.set('id', action.payload);
                },
                ['USER_LOGOUT']: function (user, action) {
                    return user.set('id', action.payload);
                },
            }
        },
        {
            path: ['global'],
            reducers: {
                ['USER_ID']: function (global, action) {
                    return global.set('user', {id: action.payload});
                }
            }
        }
    ];

    const store = createStore();

    store.register({
        state: {
            user: {},
            global: {}
        },
        reducers: mappedReducers
    });

    store.actionsWithState$.subscribe(function (incoming) {
        assert.equal(incoming.action.type, 'USER_ID', 'action has type');
        assert.equal(incoming.action.payload, '01', 'action has payload');
    });

    const result = store.dispatch({type: 'USER_ID', payload: '01'}).toJS();
    // console.log(result);
    expect(result.global.user.id).toEqual('01');
    expect(result.user.id).toEqual('01');
});

