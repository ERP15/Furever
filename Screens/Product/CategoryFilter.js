import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, FlatList, View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, } from 'react-native-paper';

const CategoryFilter = (props) => {
    console.log(props)
    return (

        <ScrollView
            bounces={true}
            horizontal={true}
            style={{ backgroundColor: "#f2f2f2" }}
        >
            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                    key={1}
                    onPress={() => {
                        props.categoryFilter('all'), props.setActive(-1)
                    }}
                >
                    <Badge style={[styles.center, { margin: 4 },
                    props.active === -1 ? styles.active : styles.inactive]}  >
                        <Text style={{ color: 'white' }}>all</Text>
                    </Badge>
                </TouchableOpacity>
                {props.categories.map((item) => (
                    <TouchableOpacity
                        key={item._id}
                        onPress={() => {
                            props.categoryFilter(item._id),
                                props.setActive(props.categories.indexOf(item))
                        }}
                    >
                        <Badge
                            style={[styles.center,
                            { margin: 5 },
                            props.active == props.categories.indexOf(item) ? styles.active : styles.inactive
                            ]}
                        >
                            <Text style={{ color: 'white' }}>{item.name}</Text>
                        </Badge>
                    </TouchableOpacity>
                ))}

            </View>
        </ScrollView>


    )
}

const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    active: {
        backgroundColor: '#FF8C42'
    },
    inactive: {
        backgroundColor: '#FFD9B3'
    }
})

export default CategoryFilter;