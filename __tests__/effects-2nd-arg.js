const createStore = require('../src');
const assert = require('assert');


it('gives `extras` as second argument', function () {
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
            function (action$, extras) {
                return action$.ofType('USER_REGISTER')
                    .map(function() {
                        return {
                            type: 'USER_ID',
                            payload: extras.state$.getValue().getIn(['user', 'name']) + '-01'
                        }
                    });
            }
        ]
    })
        .dispatch({type: 'USER_REGISTER', payload: '01'})
        .getState()
        .toJS();

    expect(result.user.id).toEqual('shane-01');
});