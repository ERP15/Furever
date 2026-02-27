import React from "react"
import { StyleSheet, Image, View, Dimensions } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
var { height, width } = Dimensions.get('window')
const Header = () => {
    
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        flexDirection: 'row',
        alignContent: "center",
        justifyContent: "center",
        padding: 0,
        marginTop: 0,
    }
})

export default Header;