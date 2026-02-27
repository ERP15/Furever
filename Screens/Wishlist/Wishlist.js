import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromWishlist, clearWishlist } from '../../Redux/Actions/cartActions';
import { addToCart } from '../../Redux/Actions/cartActions';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const Wishlist = () => {
    const wishlistItems = useSelector(state => state.wishlistItems);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const handleRemove = (item) => {
        dispatch(removeFromWishlist(item));
        Toast.show({
            topOffset: 60,
            type: 'info',
            text1: 'Removed from Wishlist',
            text2: item.name,
        });
    };

    const handleMoveToCart = (item) => {
        dispatch(addToCart(item));
        dispatch(removeFromWishlist(item));
        Toast.show({
            topOffset: 60,
            type: 'success',
            text1: 'Moved to Cart',
            text2: `${item.name} has been added to your cart`,
        });
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear Wishlist',
            'Are you sure you want to remove all items from your wishlist?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => dispatch(clearWishlist()),
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Image
                source={{
                    uri: item.image ||
                        'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png',
                }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
                {item.petType && (
                    <View style={styles.petBadge}>
                        <Ionicons name="paw" size={12} color="#FF8C42" />
                        <Text style={styles.petText}>{item.petType}</Text>
                    </View>
                )}
                <Text style={styles.price}>${item.price?.toFixed(2)}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cartButton}
                        onPress={() => handleMoveToCart(item)}
                    >
                        <Ionicons name="cart" size={16} color="white" />
                        <Text style={styles.cartButtonText}>Move to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemove(item)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (!wishlistItems || wishlistItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={80} color="#ddd" />
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                    Save items you love to your wishlist and revisit them anytime.
                </Text>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.shopButtonText}>Browse Products</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    My Wishlist ({wishlistItems.length})
                </Text>
                <TouchableOpacity onPress={handleClearAll}>
                    <Text style={styles.clearAll}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={wishlistItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id || item.id || index.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    clearAll: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    list: {
        padding: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    brand: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    petBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    petText: {
        fontSize: 12,
        color: '#FF8C42',
        fontWeight: '500',
    },
    price: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FF8C42',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    cartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#20C997',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 6,
    },
    cartButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    removeButton: {
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFE0E0',
        backgroundColor: '#FFF5F5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f5f5f5',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    shopButton: {
        marginTop: 24,
        backgroundColor: '#FF8C42',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default Wishlist;
