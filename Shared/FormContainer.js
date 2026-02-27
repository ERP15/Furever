import React from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';

var { width } = Dimensions.get('window');

const FormContainer = ({children, title}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 40,
        paddingBottom: 40,
        width: width,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#FF8C42',
        textAlign: 'center'
    }
})

export default FormContainer;