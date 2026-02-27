import {
    ADD_TO_WISHLIST,
    REMOVE_FROM_WISHLIST,
    CLEAR_WISHLIST,
    SET_WISHLIST
} from '../constants';

const wishlistItems = (state = [], action) => {
    switch (action.type) {
        case SET_WISHLIST:
            return action.payload || [];
        case ADD_TO_WISHLIST:
            // Don't add duplicates
            const exists = state.find(
                item => (item._id || item.id) === (action.payload._id || action.payload.id)
            );
            if (exists) return state;
            return [...state, action.payload];
        case REMOVE_FROM_WISHLIST:
            return state.filter(
                item => (item._id || item.id) !== (action.payload._id || action.payload.id)
            );
        case CLEAR_WISHLIST:
            return [];
        default:
            return state;
    }
}

export default wishlistItems;
