const createStore = require('../src');
const Immutable   = require('immutable');
const {fromJS}    = Immutable;

const Rx = require('rxjs');

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

describe('setup with root reducers (redux style)', function () {

    it('starts with initial state + reducer map', function () {

        const initialState = {
            settings: {
                vat: false
            }
        };

        const store = createStore(initialState, {
            user: userReducer,
            global: globalReducer
        });

        const result = store.dispatch([
            {type: 'GLOBAL_AUTH', payload: true},
            {type: 'USER_NAME', payload: 'shane'}
        ])
        .toJS();

        expect(result.global.isAuth).toEqual(true);
        expect(result.user.name).toEqual('shane');
    });
});
