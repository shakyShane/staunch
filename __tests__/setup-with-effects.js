const createStore = require('../src');
const Immutable   = require('immutable');
const Rx          = require('rx');
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
            settings: {
                vat: false
            }
        }, {
            user: userReducer,
            global: globalReducer
        }, singleEffect);

        store.dispatch({type: 'GLOBAL_AUTH', payload: true});
        expect(store.toJS().user.name).toEqual('shane');
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
                        USER_ADD: function (user, action) {
                            return user.set('auth', action.payload.auth);
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
        expect(result.user.auth).toEqual(true);
        expect(result.global.auth).toEqual(true);
    });
});
