const { createStore } = require('../dist');
const assert = require('assert');

describe('effects-test', function() {

    it('supports effects at register time', function () {
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
                    }
                    return user;
                }
            },
            effects: [
                function (action$) {
                    return action$.ofType('USER_REGISTER')
                        .map(function(incoming) {
                            return {
                                type: 'USER_ID',
                                payload: incoming.action.payload
                            }
                        })
                }
            ]
        })
            .dispatch({type: 'USER_REGISTER', payload: '01'})
            .getState()
            .toJS();

        // console.log(result);
        assert.equal(result.user.id, '01');
    });

    it('Adds meta information to the action', function () {
        const store = createStore();

        store.action$
            .take(3)
            .last()
            .subscribe(x => {
                assert.equal(x.via, '[effect]');
            });

        store.register({
            state: {
                user: {
                    name: 'shane'
                }
            },
            effects: [
                function (action$) {
                    return action$.ofType('USER_REGISTER')
                        .map(function(incoming) {
                            return {
                                type: 'USER_ID',
                                payload: incoming.action.payload
                            }
                        })
                }
            ]
        })
            .dispatch({type: 'USER_REGISTER', payload: '01'})
            .getState()
            .toJS();
    });
})