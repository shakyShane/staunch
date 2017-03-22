const { createStore } = require('../dist');
const assert = require('assert');


it('supports triggers property added to a function', function () {
    const store = createStore();
    function effect (stream) {
        return stream
            .map(function(incoming) {
                return {
                    type: 'USER_ID',
                    payload: incoming.action.payload
                }
            })
    }

    effect.triggers = ['USER_REGISTER'];

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
        effects: [effect]
    })
        .dispatch({type: 'USER_REGISTER', payload: '01'})
        .getState()
        .toJS();

    // console.log(result);
    expect(result.user.id).toEqual('01');
});

it('supports trigger property added to a function', function () {
    const store = createStore();
    function effect (stream) {
        return stream
            .map(function(incoming) {
                return {
                    type: 'USER_ID',
                    payload: incoming.action.payload
                }
            })
    }

    effect.trigger = 'USER_REGISTER';

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
        effects: [effect]
    })
        .dispatch({type: 'USER_REGISTER', payload: '01'})
        .getState()
        .toJS();

    // console.log(result);
    expect(result.user.id).toEqual('01');
});
