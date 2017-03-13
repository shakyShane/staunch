const createStore = require('../src');

describe('supporting middleware', function () {
    // const spy = jest.spy();
    it('supports middleware at store creation', function () {

        const myMock = jest.fn();

        const store = createStore({}, [], [], [
            function (store) {
                store.actionsWithResultingStateUpdate$
                    .filter(function (x) {
                        return x.action.type.indexOf('@@') !== 0;
                    })
                    .distinctUntilChanged(function (incoming) {
                        return incoming.state;
                    })
                    .subscribe(myMock);
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
        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});
        store.dispatch({type: 'USER_CREATE', payload: {name: 'shane'}});

        expect(myMock.mock.calls.length).toEqual(1);
    });
});