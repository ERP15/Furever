import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import axios from 'axios'
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from '@react-navigation/native'
import OrderCard from "../../Shared/OrderCard";

const Orders = (props) => {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(
            () => {
                getOrders();
                return () => {
                    setOrderList([]);
                }
            }, [],
        )
    )

    const getOrders = () => {
        setLoading(true);
        axios.get(`${baseURL}orders`)
            .then((res) => {
                setOrderList(res.data);
                setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setLoading(false);
            });
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF8C42" />
                <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Manage Orders ({orderList.length})</Text>
            {orderList.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No orders found</Text>
                </View>
            ) : (
                <FlatList
                    data={orderList}
                    renderItem={({ item }) => (
                        <OrderCard item={item} update={true} />
                    )}
                    keyExtractor={(item) => item.id || item._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#888',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default Orders;