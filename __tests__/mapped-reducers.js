const { createStore } = require('../dist');
const assert = require('assert');

it('Add reducer with direct action fn mapping', function () {

    const mappedReducers = [
        {
            path: ['user'],
            reducers: {
                ['USER_ID']: function (user, payload) {
                    return user.set('id', payload);
                },
                ['USER_LOGOUT']: function (user, payload) {
                    return user.set('id', payload);
                },
            }
        },
        {
            path: ['global'],
            reducers: {
                ['USER_ID']: function (global, id) {
                    return global.set('user', {id});
                }
            }
        }
    ];

    const store = createStore({state: {
        user: {name: 'shane'},
        global: {}
    }, reducers: mappedReducers});

    store.actionsWithState$.subscribe(function (incoming) {
        assert.equal(incoming.action.type, 'USER_ID', 'action has type');
        assert.equal(incoming.action.payload, '01', 'action has payload');
    });

    const result = store.dispatch({type: 'USER_ID', payload: '01'}).toJS();
    assert.equal(result.global.user.id, '01');
});

it('Add reducer with direct action -> fn mapping at register point', function () {

    const mappedReducers = [
        {
            path: ['user'],
            reducers: {
                ['USER_ID']: function (user, payload) {
                    return user.set('id', payload);
                },
                ['USER_LOGOUT']: function (user, payload) {
                    return user.set('id', payload);
                },
            }
        },
        {
            path: ['global'],
            reducers: {
                ['USER_ID']: function (global, payload) {
                    return global.set('user', {id: payload});
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
    assert.equal(result.global.user.id, '01');
    assert.equal(result.user.id, '01');
});
