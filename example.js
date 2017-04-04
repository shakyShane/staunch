const {createStore} = require('./');

const store = createStore({count: 0}, function(state) {
    return state.update('count', count => count + 1);
});

store.action$.subscribe(x => {
  console.log(x);
})

store.dispatch({type: 'anything'})
    .toJS();

console.log(store.toJS());