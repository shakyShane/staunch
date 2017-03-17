const { createStore } = require('../dist');
const assert = require('assert');


it('allows user-provided extras', function () {
    const store = createStore({}, [], [], [], [
        {
            config: {
                urls: {
                    finder: '/branches/finder/'
                }
            }
        }
    ]);
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

    expect(result.user.id).toEqual('/branches/finder/');
});
