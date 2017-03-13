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
            function (user, action) {
                switch (action.type) {
                    case 'USER_ID':
                        return user.set('id', action.payload);
                }
                return user;
            }
        ],
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
    assert.equal(result.user.id, '01', 'Action fires from an object only');
})();