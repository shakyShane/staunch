const { createStore } = require('../dist');
const { assert } = require('chai');
const Immutable   = require('immutable');
const Rx          = require('rxjs');
const {fromJS}    = Immutable;

const initialUserState = {
    name: '',
    token: ''
};

function userReducer (user, action) {
    if (!user) user = fromJS(initialUserState);

    switch (action.type) {
        case 'USER_NAME':
            return user.set('name', action.payload);
    }

    return user;
}

const initialGlobalState = {
    isAuth: false,
    isOnline: false
};

function globalReducer (global, action) {
    if (!global) global = fromJS(initialGlobalState);

    switch (action.type) {
        case 'GLOBAL_AUTH':
            return global.set('isAuth', action.payload);
    }

    return global;
}

function singleEffect (action$) {
    return action$
        .ofType('GLOBAL_AUTH')
        .flatMap(function () {
            return Rx.Observable.concat(
                Rx.Observable.of({
                    type: 'USER_NAME',
                    payload: 'shane'
                })
            )
        })
}

describe('setup with single effect', function () {

    it('starts with initial state, reducers & effects', function () {

        const store = createStore({
            state: {
                settings: {
                    vat: false
                }
            },
            reducers: {
                user: userReducer,
                global: globalReducer
            },
            effects: singleEffect
        });

        store.dispatch({type: 'GLOBAL_AUTH', payload: true});
        assert.equal(store.toJS().user.name, 'shane');
    });

    it('Adding auto mapping', function () {

        const store = createStore();

        store.register({
            state: {
                user: {
                    name: 'shane'
                },
                global: {
                    auth: false
                }
            },
            reducers: [
                {
                    path: ['user'],
                    reducers: {
                        USER_ADD: function (user, payload) {
                            return user.set('auth', payload.auth);
                        }
                    }
                },
                {
                    global: function (global, action) {
                        switch (action.type) {
                            case 'GLOBAL_AUTH':
                                return global.set('auth', action.payload);
                            default:
                                return global;
                        }
                    }
                }
            ],
            responses: [{
                'GLOBAL_AUTH': {
                    action: 'USER_ADD',
                    path: ['global']
                }
            }]
        });

        const result = store.dispatch({type: 'GLOBAL_AUTH', payload: true}).toJS();
        assert.equal(result.user.auth, true);
        assert.equal(result.global.auth, true);
    });
});
