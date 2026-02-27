import React, { useEffect, useState } from "react"
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TextInput,
    StyleSheet
} from "react-native"
import EasyButton from "../../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage'


var { width } = Dimensions.get("window")

const Item = (props) => {
    return (
        <View style={styles.item}>
            <Text style={{ flex: 1 }}>{props.item.name}</Text>
            <View style={{ flexDirection: 'row', gap: 5 }}>
                <EasyButton
                    primary
                    medium
                    onPress={() => props.edit(props.item)}
                >
                    <Text style={{ color: "white", fontWeight: "bold" }}>Edit</Text>
                </EasyButton>
                <EasyButton
                    danger
                    medium
                    onPress={() => props.delete(props.item.id || props.item._id)}
                >
                    <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
                </EasyButton>
            </View>
        </View>
    )
}

const Categories = (props) => {

    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [token, setToken] = useState();
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res);
            })
            .catch((error) => console.log(error));

        axios
            .get(`${baseURL}categories`)
            .then((res) => setCategories(res.data))
            .catch((error) => alert("Error  load categories"))

        return () => {
            setCategories();
            setToken();
        }
    }, [])

    const addCategory = () => {
        const category = {
            name: categoryName
        };

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };

        axios
            .post(`${baseURL}categories`, category, config)
            .then((res) => setCategories([...categories, res.data]))
            .catch((error) => alert("Error add categories"));

        setCategoryName("");
    }

    const startEdit = (item) => {
        setEditingCategory(item);
        setCategoryName(item.name);
    }

    const cancelEdit = () => {
        setEditingCategory(null);
        setCategoryName("");
    }

    const updateCategory = () => {
        if (!editingCategory) return;
        const id = editingCategory.id || editingCategory._id;

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };

        axios
            .put(`${baseURL}categories/${id}`, { name: categoryName }, config)
            .then((res) => {
                const updated = categories.map((cat) =>
                    (cat.id || cat._id) === id ? res.data : cat
                );
                setCategories(updated);
                setEditingCategory(null);
                setCategoryName("");
            })
            .catch((error) => alert("Error updating category"));
    }

    const deleteCategory = (id) => {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };

        axios
            .delete(`${baseURL}categories/${id}`, config)
            .then((res) => {
                const newCategories = categories.filter((item) => (item.id || item._id) !== id);
                setCategories(newCategories);
            })
            .catch((error) => alert("Error delete categories"));
    }

    return (
        <View style={{ position: "relative", height: "100%" }}>
            <View style={{ marginBottom: 60 }}>
                <FlatList
                    data={categories}
                    renderItem={({ item, index }) => (
                        <Item item={item} index={index} delete={deleteCategory} edit={startEdit} />
                    )}
                    keyExtractor={(item) => item.id || item._id}
                />
            </View>
            <View style={styles.bottomBar}>
                <View>
                    <Text>{editingCategory ? "Edit Category" : "Add Category"}</Text>
                </View>
                <View style={{ width: width / 2.5 }}>
                    <TextInput
                        value={categoryName}
                        style={styles.input}
                        onChangeText={(text) => setCategoryName(text)}
                    />
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    {editingCategory ? (
                        <>
                            <EasyButton
                                medium
                                primary
                                onPress={() => updateCategory()}
                            >
                                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
                            </EasyButton>
                            <EasyButton
                                medium
                                danger
                                onPress={() => cancelEdit()}
                            >
                                <Text style={{ color: "white", fontWeight: "bold" }}>Cancel</Text>
                            </EasyButton>
                        </>
                    ) : (
                        <EasyButton
                            medium
                            primary
                            onPress={() => addCategory()}
                        >
                            <Text style={{ color: "white", fontWeight: "bold" }}>Submit</Text>
                        </EasyButton>
                    )}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bottomBar: {
        backgroundColor: "white",
        width: width,
        minHeight: 60,
        padding: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: "absolute",
        bottom: 0,
        left: 0
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1
    },
    item: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
        padding: 5,
        margin: 5,
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 5
    }
})

export default Categories;