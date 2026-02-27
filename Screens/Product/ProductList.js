import React from "react";
import { View, Dimensions } from "react-native";

var { width } = Dimensions.get("window")
import ProductCard from "./ProductCard";

const ProductList = (props) => {
    const { item, horizontal } = props;
    
    if (horizontal) {
        return (
            <View style={{ marginRight: 10, width: width / 2.2 }}>
                <ProductCard {...item} />
            </View>
        );
    }
    
    return (
        <View style={{ width: '50%' }}>
            <View style={{ width: width / 2, backgroundColor: 'gainsboro' }}>
                <ProductCard {...item} />
            </View>
        </View>
    )
}
export default ProductList;