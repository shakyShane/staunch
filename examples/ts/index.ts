import Immutable = require('immutable');
import Rx = require('rx');

const { createStore } = require('../../dist/index');

const store = createStore({user: {name: 'shane'}});

console.log(store.toJS());