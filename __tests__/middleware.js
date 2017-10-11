const { createStore } = require('../dist');
const {assert} = require('chai');

describe('supporting middleware', function () {
    // const spy = jest.spy();
    it('supports middleware at store creation', function () {

        let calls = 0;

        const store = createStore({
            middleware: [
                function (store) {
                    store.actionsWithResultingStateUpdate$
                        .filter(function (x) {
                            return x.action.type.indexOf('@@') !== 0;
                        })
                        .distinctUntilChanged(function (incoming) {
                            return incoming.state;
                        })
                        .subscribe(x => calls++);
                }
            ]
        });

        store.register({
            state: {
                user: {
                    name: 'shane'
                }
            },
            reducers: [
                function (user, action) {
                    switch(action.type) {
                        case 'USER_MODDED':
                            return user.set('name', action.payload)
                    }
                    return user;
                }
            ]
        });

        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});
        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});
        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});

        assert.equal(calls, 1);
    });
    it('supports middleware at store creation via chaining', function () {

        let calls = 0;

        const store = createStore()
            .addMiddleware([
                function (store) {
                    store.action$.subscribe(x => calls++);
                }
            ]);

        store.register({
            state: {
                user: {
                    name: 'shane'
                }
            },
            reducers: [
                function (user, action) {
                    switch(action.type) {
                        case 'USER_MODDED':
                            return user.set('name', action.payload)
                    }
                    return user;
                }
            ]
        });

        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});
        assert.equal(calls, 2);
    });
});
