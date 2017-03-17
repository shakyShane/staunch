const createStore = require('../src');
const Immutable = require('immutable');
require('rxjs/add/operator/skip');

it('toJS() (full)', function () {
    const store = createStore({name: 'shane'});

    store.addReducers(function (state, action) {
        return state.set('name', 'kittie');
    });

    expect(store.dispatch({type: 'anything'}).toJS().name).toEqual('kittie')
});

it('toJS() (path)', function () {
    const store = createStore({user: {name: 'shane'}});
    expect(store.toJS('user').name).toEqual('shane')
});

it('toJSON() (full)', function () {
    const input    = {name: 'shane'};
    const store    = createStore(input);
    const expected = Immutable.fromJS(input).toJSON();
    const actual   = store.toJSON();
    expect(actual).toEqual(expected);
});

it('toJSON() (path)', function () {
    const input    = {user: {name: 'shane'}};
    const store    = createStore(input);
    const expected = Immutable.fromJS(input.user).toJSON();
    const actual   = store.toJSON(['user']);
    expect(actual).toEqual(expected);
});

it('addReducers() Add global reducer function with access to everything', function () {
    const store = createStore({user: {name: 'shane'}});

    const fn = function (state, action) {
        switch (action.type) {
            case 'USER_ID':
                return state.setIn(['user', 'id'], action.payload);
        }
        return state;
    };

    const result = store.addReducers([fn])
        .dispatch({type: 'USER_ID', payload: '01'})
        .getState()
        .toJS();

    expect(result.user.id).toEqual('01');
});


it('addReducers() Add reducer function tied to a path (id) (name)', function () {

    const store = createStore({user: {name: 'shane'}});

    const fn2 = function (user, action) {
        switch (action.type) {
            case 'USER_ID':
                return user.set('id', action.payload);
        }
        return user;
    };
    const fn3 = function (user, action) {
        switch (action.type) {
            case 'USER_NAME':
                return user.set('name', action.payload);
        }
        return user;
    };

    const result = store.addReducers([{path: ['user'], fns: [fn2, fn3]}])
        .dispatch({type: 'USER_ID', payload: '01'})
        .dispatch({type: 'USER_NAME', payload: 'Shane'})
        .getState()
        .toJS();

    expect(result.user.id).toEqual('01');
    expect(result.user.name).toEqual('Shane');
});

it('once() - can respond a maximum of 1 time to an action', function () {

    const myMock = jest.fn();

    const store = createStore({}, function (state) {
        return state;
    });

    store.once('anything')
        .subscribe(x => myMock());

    store
        .dispatch({type: 'anything'})
        .dispatch({type: 'anything'})
        .dispatch({type: 'anything'});

    expect(myMock.mock.calls.length).toEqual(1);
});
