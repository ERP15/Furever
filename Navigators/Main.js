import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import HomeNavigator from "./HomeNavigator";
import { Ionicons } from "@expo/vector-icons";
import CartNavigator from "./CartNavigator";
import CartIcon from "../Shared/CartIcon";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import Wishlist from "../Screens/Wishlist/Wishlist";
import { useSelector } from "react-redux";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Tab = createBottomTabNavigator();

const Main = () => {
    const wishlistItems = useSelector(state => state.wishlistItems);
    const context = useContext(AuthGlobal);
    const isAdmin = context?.stateUser?.user?.isAdmin === true;
    
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#FF8C42',
                tabBarInactiveTintColor: '#999',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 6,
                    paddingTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigator}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => {
                        return <Ionicons
                            name="home"
                            style={{ position: "relative" }}
                            color={color}
                            size={26}
                        />
                    }
                }}
            />

            <Tab.Screen
                name="Cart Screen"
                component={CartNavigator}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ color }) => {
                        return <>
                            <Ionicons
                                name="cart"
                                style={{ position: "relative" }}
                                color={color}
                                size={26}
                            />
                            <CartIcon />
                        </>
                    }
                }}
            />

            <Tab.Screen
                name="Wishlist"
                component={Wishlist}
                options={{
                    headerShown: true,
                    title: 'Wishlist',
                    headerStyle: { backgroundColor: '#FF8C42' },
                    headerTintColor: 'white',
                    tabBarLabel: 'Wishlist',
                    tabBarIcon: ({ color }) => {
                        return <View>
                            <Ionicons
                                name="heart"
                                style={{ position: "relative" }}
                                color={color}
                                size={26}
                            />
                            {wishlistItems && wishlistItems.length > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    right: -8,
                                    top: -4,
                                    backgroundColor: '#FF6B6B',
                                    borderRadius: 8,
                                    minWidth: 16,
                                    height: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                                        {wishlistItems.length}
                                    </Text>
                                </View>
                            )}
                        </View>
                    },
                }}
            />

            {isAdmin && (
                <Tab.Screen
                    name="Admin"
                    component={AdminNavigator}
                    options={{
                        headerShown: false,
                        tabBarLabel: 'Admin',
                        tabBarIcon: ({ color }) => {
                            return <Ionicons
                                name="cog"
                                style={{ position: "relative" }}
                                color={color}
                                size={26}
                            />
                        }
                    }}
                />
            )}

            <Tab.Screen
                name="User"
                component={UserNavigator}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color }) => {
                        return <Ionicons
                            name="person"
                            style={{ position: "relative" }}
                            color={color}
                            size={26}
                        />
                    }
                }}
            />
        </Tab.Navigator>
    )
}
export default Main