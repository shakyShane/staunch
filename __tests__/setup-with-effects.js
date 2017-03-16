const createStore = require('../src');
const Immutable   = require('immutable');
const {fromJS}    = Immutable;

require('rxjs/add/operator/mergeMap');

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
});
