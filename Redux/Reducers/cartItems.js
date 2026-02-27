import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    UPDATE_CART_QUANTITY,
    SET_CART
} from '../constants';

const cartItems = (state = [], action) => {
    switch (action.type) {
        case SET_CART:
            return action.payload || [];
        case ADD_TO_CART:
            // Check if item already in cart, if so increase quantity
            const existingIndex = state.findIndex(
                item => (item._id || item.id) === (action.payload._id || action.payload.id)
            );
            if (existingIndex >= 0) {
                return state.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...state, { ...action.payload, quantity: 1 }];
        case REMOVE_FROM_CART:
            return state.filter(cartItem => cartItem !== action.payload);
        case UPDATE_CART_QUANTITY:
            return state.map(item =>
                (item._id || item.id) === action.payload.id
                    ? { ...item, quantity: action.payload.quantity }
                    : item
            ).filter(item => item.quantity > 0);
        case CLEAR_CART:
            return [];
        default:
            return state;
    }
}

export default cartItems;