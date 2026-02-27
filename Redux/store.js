import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import cartItems from './Reducers/cartItems';
import wishlistItems from './Reducers/wishlistItems';

const reducers = combineReducers({
    cartItems: cartItems,
    wishlistItems: wishlistItems
})

const store = createStore(
    reducers,
    applyMiddleware(thunk)
)

export default store;