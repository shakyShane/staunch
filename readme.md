## staunch

> loyal, firm, and dependable - solid or substantial in construction

Staunch is a highly opinionated Redux-style state management system for large-scale apps. Powered by 
ImmutableJS & RxJS - plug it into any codebase.

## Install

Note, RxJS & ImmutableJS are *requirements*, you'll need to install them separately. 

```bash
yarn add staunch-store

npm i staunch-store --save
```

## Features

- It's like ImmutableJS, RxJS, Redux & Redux-Observable all got together and had a baby 

## Example 1 - Redux style

```js
import { createStore } from 'staunch-store';
import { fromJS } from 'immutable';

/**
 * Define a 'user' reducer, that optionally
 * will use some default state
 */
function userReducer (user = fromJS({auth: false}), action) {
    
    switch(action.type) {
        case 'USER_AUTH':
            return user.set('auth', action.payload);
        default:
            return user;
    }
}

/**
 * Create a store with 1 or many reducers (like combineReducers)
 */
const store = createStore({}, {
    user: userReducer
});
```

## Example 2 - Effects built-in

```js
import { createStore } from 'staunch-store';

/**
 * Create a store
 */
const store = createStore();

/**
 * Define a 'user' reducer
 */
function userReducer (user, action) {
    
    switch(action.type) {
        case 'USER_FETCH':
            return user.set('loading', true);
        default:
            return user;
    }
}

/**
 * When USER_FETCH is fired, triggered an ajax request, 
 * mapping the result (or error) to other actions that
 * affect the state
 */
function userEffect(action$) {
    return action$.ofType('USER_FETCH')
        .flatMapLatest(({action, state}) => {
            return fetch(action.payload.url).then(x => x.json())
        })
        .map(result => {
            return userFetchSuccess(result)
        })
        .catch(err => {
            return Rx.Observable.of(userFetchError(err));
        })
}

/**
 * Now register the reducer, with some default state
 */
store.register({
    state: {
        // some some default state here, 
        // this will automatically be converted into
        // an immutable map
        user: {auth: false}
    },
    reducers: userReducer,
    effects: userEffect
});

/**
 * Now fire the USER_AUTH action
 */
store.dispatch({type: 'USER_AUTH'});

```