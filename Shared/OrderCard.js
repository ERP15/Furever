import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import TrafficLight from "./StyledComponents/TrafficLight";
import EasyButton from "./StyledComponents/EasyButton";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";

import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { useNavigation } from '@react-navigation/native'

const STATUS_CONFIG = {
  Pending: { color: '#FF8C42', icon: 'time', trafficLight: 'unavailable' },
  Processing: { color: '#339AF0', icon: 'construct', trafficLight: 'limited' },
  Shipped: { color: '#FFD43B', icon: 'airplane', trafficLight: 'limited' },
  Delivered: { color: '#51CF66', icon: 'checkmark-circle', trafficLight: 'available' },
  Canceled: { color: '#FF6B6B', icon: 'close-circle', trafficLight: 'unavailable' },
};

const statuses = [
  { name: "Pending", code: "Pending" },
  { name: "Processing", code: "Processing" },
  { name: "Shipped", code: "Shipped" },
];

const OrderCard = ({ item, update }) => {
  const [statusChange, setStatusChange] = useState(item.status || 'Pending');
  const [token, setToken] = useState('');

  const navigation = useNavigation();

  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;

  useEffect(() => {
    AsyncStorage.getItem("jwt")
      .then((res) => setToken(res))
      .catch((error) => console.log(error));
  }, []);

  const updateOrder = () => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    axios
      .put(`${baseURL}orders/${item.id || item._id}`, { status: statusChange }, config)
      .then((res) => {
        if (res.status == 200 || res.status == 201) {
          Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Order Updated",
            text2: `Status changed to ${statusChange}`,
          });
          setTimeout(() => {
            navigation.navigate("Products");
          }, 500);
        }
      })
      .catch((error) => {
        Toast.show({
          topOffset: 60,
          type: "error",
          text1: "Something went wrong",
          text2: "Please try again",
        });
      });
  };

  return (
    <View style={[{ backgroundColor: cfg.color }, styles.container]}>
      <View style={styles.container}>
        <Text style={styles.orderNumber}>Order #{(item.id || item._id || '').toString().slice(-8)}</Text>
      </View>
      <View style={{ marginTop: 10 }}>
        <View style={styles.statusRow}>
          <Ionicons name={cfg.icon} size={18} color="white" />
          <Text style={styles.statusLabel}> {item.status || 'Pending'}</Text>
        </View>
        <Text style={styles.detailText}>
          Address: {item.shippingAddress1} {item.shippingAddress2}
        </Text>
        <Text style={styles.detailText}>City: {item.city}</Text>
        <Text style={styles.detailText}>Country: {item.country}</Text>
        {item.paymentMethod && (
          <Text style={styles.detailText}>Payment: {item.paymentMethod === 'gcash' ? 'GCash' : item.paymentMethod === 'card' ? 'Card' : item.paymentMethod === 'cod' ? 'COD' : item.paymentMethod}</Text>
        )}
        <Text style={styles.detailText}>
          Date Ordered: {item.dateOrdered ? item.dateOrdered.split("T")[0] : 'N/A'}
        </Text>
        <View style={styles.priceContainer}>
          <Text>Price: </Text>
          <Text style={styles.price}>$ {item.totalPrice ? item.totalPrice.toFixed(2) : '0.00'}</Text>
        </View>

        {update ? (
          <View>
            <Picker
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, marginTop: 10 }}
              selectedValue={statusChange}
              onValueChange={(e) => setStatusChange(e)}
            >
              {statuses.map((s) => (
                <Picker.Item key={s.code} label={s.name} value={s.code} />
              ))}
            </Picker>
            <EasyButton
              secondary
              large
              onPress={() => updateOrder()}
            >
              <Text style={{ color: "white" }}>Update Status</Text>
            </EasyButton>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  detailText: {
    color: 'white',
    marginVertical: 2,
  },
  title: {
    backgroundColor: "#20C997",
    padding: 5,
  },
  priceContainer: {
    marginTop: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
  },
  price: {
    color: "white",
    fontWeight: "bold",
  },
});

export default OrderCard;