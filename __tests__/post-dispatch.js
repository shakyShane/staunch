const { createStore } = require('../dist');
const assert = require('assert');

it('allows fns to be registered to be called outside of stream lifecycle', function () {
    let calls = 0;
    const store = createStore({
        postDispatch: [function () {
            calls++;
        }],
        extras: {
            config: {
                urls: {
                    finder: '/branches/finder/'
                }
            }
        }
    });
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
            function (action$, extras) {
                return action$.ofType('USER_REGISTER')
                    .map(function() {
                        return {
                            type: 'USER_ID',
                            payload: extras.config.urls.finder
                        }
                    });
            }
        ]
    })
        .dispatch({type: 'USER_REGISTER', payload: '01'})
        .getState()
        .toJS();

    assert.equal(calls, 3, 'first is INIT');
});
