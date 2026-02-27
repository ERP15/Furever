import React, { useEffect, useState, useContext } from 'react'
import { Text, View, Button, SafeAreaView, Select, TouchableOpacity, StyleSheet } from 'react-native'

import Icon from 'react-native-vector-icons/FontAwesome'
import { Ionicons } from '@expo/vector-icons'
import FormContainer from '../../Shared/FormContainer'
import Input from '../../Shared/Input'
import AddressMapPicker from '../../Shared/AddressMapPicker'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'

const countries = require("../../assets/data/countries.json");
import AuthGlobal from '../../Context/Store/AuthGlobal'
import Toast from 'react-native-toast-message'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import baseURL from '../../assets/common/baseurl'
const Checkout = (props) => {
    const [user, setUser] = useState('')
    const [orderItems, setOrderItems] = useState([])
    const [address, setAddress] = useState('')
    const [address2, setAddress2] = useState('')
    const [phone, setPhone] = useState('')
    const [showMapPicker, setShowMapPicker] = useState(false)
    const [coordinates, setCoordinates] = useState(null)

    const navigation = useNavigation()
    const cartItems = useSelector(state => state.cartItems)
    const context = useContext(AuthGlobal);
    
    useEffect(() => {
        setOrderItems(cartItems)
        if (context.stateUser.isAuthenticated) {
            setUser(context.stateUser.user.userId)
            // Fetch user profile to pre-populate address fields
            AsyncStorage.getItem('jwt')
                .then((token) => {
                    axios
                        .get(`${baseURL}users/${context.stateUser.user.userId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                        .then((res) => {
                            const userData = res.data;
                            if (userData.phone) setPhone(userData.phone);
                            if (userData.shippingAddress) setAddress(userData.shippingAddress);
                        })
                        .catch((err) => {
                            console.log('Error loading user profile:', err);
                            // Fallback to auth context data (works for test/quick login accounts)
                            const ctxUser = { ...(context.stateUser.user || {}), ...(context.stateUser.userProfile || {}) };
                            if (ctxUser.phone) setPhone(ctxUser.phone);
                            if (ctxUser.shippingAddress) setAddress(ctxUser.shippingAddress);
                        });
                })
                .catch((err) => console.log('Error getting token:', err));
        } else {
            navigation.navigate("User", { screen: 'Login' });
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please Login to Checkout",
                text2: ""
            });
        }

        return () => {
            setOrderItems();
        }
    }, [])

    const checkOut = () => {
        console.log("orders", orderItems)
        let order = {
            dateOrdered: Date.now(),
            orderItems,
            phone,
            shippingAddress1: address,
            shippingAddress2: address2,
            status: "Pending",
            user,
        }
        console.log("ship", order)
        navigation.navigate("Payment", { order })
    }

    const handleLocationSelect = (locationData) => {
        setAddress(locationData.address);
        setCoordinates(locationData.coordinates);
        
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Location Selected",
            text2: "Address has been updated"
        });
    }

    return (

        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
        >
            <FormContainer title={"Shipping Address"}>
                <Input
                    placeholder={"Phone"}
                    name={"phone"}
                    value={phone}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPhone(text)}
                />

                {/* Map Picker Button */}
                <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => setShowMapPicker(true)}
                >
                    <Ionicons name="map" size={24} color="#fff" />
                    <Text style={styles.mapButtonText}>Select Address from Map</Text>
                </TouchableOpacity>

                <Input
                    placeholder={"Shipping Address 1"}
                    name={"ShippingAddress1"}
                    value={address}
                    onChangeText={(text) => setAddress(text)}
                />
                <Input
                    placeholder={"Shipping Address 2"}
                    name={"ShippingAddress2"}
                    value={address2}
                    onChangeText={(text) => setAddress2(text)}
                />

                <View style={{ width: '80%', alignItems: "center" }}>
                    <Button title="Confirm" onPress={() => checkOut()} />
                </View>
            </FormContainer>

            {/* Address Map Picker Modal */}
            <AddressMapPicker
                visible={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onSelectLocation={handleLocationSelect}
            />
        </KeyboardAwareScrollView>

    )
}

const styles = StyleSheet.create({
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff6347',
        padding: 15,
        borderRadius: 8,
        marginVertical: 10,
        width: '80%',
        alignSelf: 'center',
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default Checkout