const createStore = require('../src');
const Rx = require('rxjs');
const assert = require('assert');


it('allows user to provide a scheduler', function () {
    const s = new Rx.VirtualTimeScheduler();
    const store = createStore({}, [], [], [], [
        {
            scheduler: s
        }
    ]);
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
                    .map(function(incoming) {
                        return {
                            type: 'USER_ID',
                            payload: incoming.action.payload
                        }
                    })
                    .delay(20000, extras.scheduler)
            }
        ]
    })
        .dispatch({type: 'USER_REGISTER', payload: '01'})
        .getState()
        .toJS();

    s.flush();

});