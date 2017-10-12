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

 - [Simple counter](https://jsfiddle.net/v427t3bo/)
 - [Change feed](https://jsfiddle.net/5wgncryx/)
 - [Previous + Current State](https://jsfiddle.net/e35zznhr/2/)
 - [Multiple Reducers](https://jsfiddle.net/xhzps4z8/)
 - [Ajax](https://jsfiddle.net/bvssgo6r/3/)

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
import { createStore } from "staunch-store"

const store = createStore({
  state: { user: { name: "Shane" } }
})

// listen to the entire state tree for changes
store
  .changes()
  .subscribe(state =>
    console.log("updated state", state.toJS())
  )

// or listen to just the 'user' section of the state
store
  .changes("user")
  .subscribe(user =>
    console.log("updated state", user.toJS())
  )

// dispatch an action
store.dispatch({ type: "USER_AUTH" })
```

### Complete safety and removal of defensive coding patterns
The true power of immutable data can only be realised when you go 'all-in'. Staunch will 
convert your initial state, or any that's added on the fly into ImmutableJS Maps or Lists automatically. 
This allows you the freedom to just code your state updates without having to worry about mutating anything. 
Say good riddance to `Object.assign` once and for all!

```js
import { createStore } from 'staunch-store';

const config = {
  state: { user: { name: "shane", auth: false } },
  reducers: {
    //user is bound to the user "path" in the store
    user(user, action) {
      switch (action.type) {
        case "USER_AUTH":
          //note we're working directly with the user
          return user.set("auth", action.payload)
        default:
          return user
      }
    }
  }
}

const store = createStore(config)

store
  .changes("user")
  .subscribe(user => console.log(user.toJS()))

store.dispatch({ type: "USER_AUTH", payload: true })
```

### Mapped Reducers
Mapped reducers help simplify the `switch/case` syntax of a traditional redux reducer by moving
the action `type` into an object key and the `payload` as the second argument:

```js
import { createStore } from "staunch-store"

const USER_AUTH = "USER_AUTH"
const USER_CHANGE_NAME = "USER_CHANGE_NAME"

const config = {
  state: {
    user: { name: "shane", auth: false }
  },
  reducers: [
    {
      path: ["user"],
      reducers: {
        [USER_AUTH]: (user, payload) =>
          user.set("auth", payload),
        [USER_CHANGE_NAME]: (user, payload) =>
          user.set("name", payload)
      }
    }
  ]
}

const store = createStore(config)

store
  .changes("user")
  .subscribe(user => console.log(user.toJS()))

store.dispatch({
  type: USER_AUTH,
  payload: true
})
store.dispatch({
  type: USER_CHANGE_NAME,
  payload: "john"
})
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
