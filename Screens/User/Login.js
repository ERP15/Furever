
import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, Button, Dimensions, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import FormContainer from "../../Shared/FormContainer";
import { Ionicons } from "@expo/vector-icons";
import { jwtDecode } from "jwt-decode";

import AuthGlobal from '../../Context/Store/AuthGlobal'
import { loginUser, setCurrentUser } from '../../Context/Actions/Auth.actions'
import { loadUserCart, loadUserWishlist, setCartUserId } from '../../Redux/Actions/cartActions'
import { useDispatch } from 'react-redux'
import Input from "../../Shared/Input";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";

var { width } = Dimensions.get('window')

const Login = (props) => {
    const context = useContext(AuthGlobal)
    const navigation = useNavigation()
    const reduxDispatch = useDispatch()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState("")

    const handleSubmit = () => {
        const user = {
            email,
            password,
        };

        if (email === "" || password === "") {
            setError("Please fill in your credentials");
        } else {
            loginUser(user, context.dispatch, navigation);
        }
    };

    // Quick-login helper — uses real API to get valid user IDs
    const quickLogin = async (email, accountType) => {
        try {
            const response = await fetch(`${baseURL}users/login`, {
                method: "POST",
                body: JSON.stringify({ email, password: "password123" }),
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            
            if (data && data.token) {
                const token = data.token;
                await AsyncStorage.setItem("jwt", token);
                
                // Decode the JWT token to get user info
                const decoded = jwtDecode(token);
                
                context.dispatch(setCurrentUser(decoded, data.user));

                // Load persisted cart & wishlist for this user
                setCartUserId(decoded.userId);
                reduxDispatch(loadUserCart(decoded.userId));
                reduxDispatch(loadUserWishlist(decoded.userId));

                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: `Logged in as ${data.user.name}`,
                    text2: accountType === "admin" ? "Admin account" : "Customer account",
                });
            } else {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Quick login failed",
                    text2: data.message || "Please try manual login",
                });
            }
        } catch (err) {
            console.error("Quick login error:", err);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Quick login failed",
                text2: "Please try manual login",
            });
        }
    };

    useEffect(() => {
        if (context.stateUser.isAuthenticated === true) {
            navigation.navigate("Home")
        }
    }, [context.stateUser.isAuthenticated])

    return (
        <FormContainer title="🐾 Furever Pet Store" >
            <Input
                placeholder={"Enter email"}
                name={"email"}
                id={"email"}
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
            />
            <Input
                placeholder={"Enter Password"}
                name={"password"}
                id={"password"}
                secureTextEntry={true}
                value={password}
                onChangeText={(text) => setPassword(text)}
            />
            <View style={styles.authRow}>
                <TouchableOpacity
                    style={[styles.authBtn, styles.loginBtn]}
                    onPress={() => handleSubmit()}
                >
                    <Text style={styles.authBtnText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.authBtn, styles.registerBtn]}
                    onPress={() => navigation.navigate("Register")}
                >
                    <Text style={styles.authBtnText}>Register</Text>
                </TouchableOpacity>
            </View>

            {/* ── Quick-login test accounts ── */}
            <View style={styles.quickSection}>
                <Text style={styles.quickLabel}>— Quick Login (no password) —</Text>
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={[styles.quickBtn, { backgroundColor: '#20C997' }]}
                        onPress={() => quickLogin('user@furever.com', 'user')}
                    >
                        <Ionicons name="person" size={18} color="white" />
                        <Text style={styles.quickBtnText}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickBtn, { backgroundColor: '#FF8C42' }]}
                        onPress={() => quickLogin('admin@furever.com', 'admin')}
                    >
                        <Ionicons name="shield" size={18} color="white" />
                        <Text style={styles.quickBtnText}>Admin</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.quickHint}>Emma Pascua  ·  Jannella Yumang</Text>
            </View>

            <View style={styles.buttonGroup}>
                <Text style={styles.middleText}>Don't have an account yet?</Text>
            </View>
        </FormContainer>
    )
}
const styles = StyleSheet.create({
    buttonGroup: {
        width: "80%",
        alignItems: "center",
    },
    authRow: {
        width: "80%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 10,
    },
    authBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    loginBtn: {
        backgroundColor: "#FF8C42",
    },
    registerBtn: {
        backgroundColor: "#20C997",
    },
    authBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    middleText: {
        marginBottom: 60,
        alignSelf: "center",
    },
    quickSection: {
        width: "80%",
        alignItems: "center",
        marginVertical: 20,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    quickLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 12,
    },
    quickRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 8,
    },
    quickBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    quickHint: {
        fontSize: 11,
        color: '#bbb',
        marginTop: 10,
    },
});
export default Login;