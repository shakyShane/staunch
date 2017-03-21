## staunch

> loyal, firm, and dependable - solid or substantial in construction

Staunch is a highly opinionated Redux-style state management system for large-scale apps. Powered by 
ImmutableJS & RxJS. It's designed to handle both the synchronous state-updates we've all come to love, along
with providing best-in-game async support via the mighty RxJS.
 
We're talking serious power/safety here - combine this with a tiny view library Preact, and you have the tools
to build something amazing.

**Example bundle 41.3kb (min+gzipped)**

 - ImmutableJS
 - Rx-Lite
 - Staunch-store
 - Preact

So Staunch, Rx-Lite, ImmutableJS + Preact all together weigh in at less than 42kb combined - this means it's 
not really suitable for micro-apps, but if you're already using Immutable or Rx in a project, you can add Staunch
on top without issue :)

## Examples

 - [simple counter](https://jsfiddle.net/vz4wod27/)
 - [change feed](https://jsfiddle.net/5wgncryx/)
 - [multiple reducers]()

## Install

Note, RxJS & ImmutableJS are *requirements*, you'll need to install them separately. 

```bash
yarn add rx immutable staunch-store

npm i rx immutable staunch-store --save
```

### Change feed for entire store, or any part of the state object. 
No joke, just specify which 'path' on the tree you're interested in and you'll only be notified
when the data has actually changed.

```js
const { createStore } = require('staunch-store');
const store = createStore({user: {name: 'Shane'}});

// listen to the entire state tree for changes
store.changes()
    .subscribe(state => 
        console.log('updated state', state)
    );
    
// or listen to just the 'user' section of the state
store.changes('user')
    .subscribe(user => 
        console.log('updated state', user)
    );

// dispatch an action
store.dispatch({type: 'USER_AUTH'});
```

### Complete safety and removal of defensive coding patterns
The true power of immutable data can only be realised when you go 'all-in'. Staunch will 
convert your initial state, or any that's added on the fly into ImmutableJS Maps or Lists automatically. 
This allows you the freedom to just code your state updates without having to worry about mutating anything. 
Say good riddance to `Object.assign` once and for all!

```js
import { createStore } from 'staunch-store';
import { fromJS } from 'immutable';

// initial user state
const intitial = {user: {name: 'shane'}};

// create store + add a reducer that will be
// bound to the 'user' path
const store = createStore(intitial, {
    user: function userReducer (user, action) {
          switch(action.type) {
              case 'USER_AUTH':
                  // look ma, no Object.assign in sight!
                  return user.set('auth', action.payload); 
              default:
                  return user;
          }
    }
});
```

### Async built in
Nothing solves async like Rx does. Taking inspiration from `redux-observable` and building upon it, 
Staunch has side effects nailed. Effects are just functions that take a stream of actions
 and return more actions. 


```js
import { createStore } from 'staunch-store';

const initial = {user: {auth: false}};


/**
 * User reducer
 */
function userReducer (user, action) {
    switch(action.type) {
        case 'USER_FETCH':
            return user.set('loading', true);
        case 'USER_FETCH_SUCCESS':
            return user.set('data', action.payload);
        case 'USER_FETCH_ERROR':
            return user
                .set('data', {})
                .set('message', action.payload)
        default:
            return user;
    }
}

/**
 * action$ here is a stream of all actions that occur
 * When USER_FETCH is fired, it will trigger an ajax request 
 * mapping the result (or error) to other actions that
 * affect the state.
 */
function userEffect(action$) {
    return action$.ofType('USER_FETCH')
        .flatMapLatest(({action, state}) => {
            return fetch(action.payload.url).then(x => x.json())
        })
        .map(result => {
            return {
                type: 'USER_FETCH_SUCCESS',
                payload: result
            }
        })
        .catch(err => {
            return Rx.Observable.of({
                type: 'USER_FETCH_ERROR',
                payload: err.message
            });
        });
}

// store with 
// 1. initial state 
// 2. reducer bound to 'user' path
// 3. the userEffect fn
const store = createStore(initial, {
    user: userReducer
}, userEffect);


/**
 * Now fire the USER_AUTH action
 */
store.dispatch({type: 'USER_AUTH'});

```