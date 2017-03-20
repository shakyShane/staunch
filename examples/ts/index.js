"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var createStore = require('../../dist/index').createStore;
var store = createStore({ user: { name: 'shane' } });
console.log(store.toJS());
