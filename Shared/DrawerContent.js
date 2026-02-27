import { useNavigation } from '@react-navigation/native';
import React, { useState, useContext } from 'react';
import { Drawer } from 'react-native-paper';
import AuthGlobal from '../Context/Store/AuthGlobal';

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();
  const context = useContext(AuthGlobal);
  const isAdmin = context?.stateUser?.user?.isAdmin === true;

  return (
    <Drawer.Section title="Menu">
      <Drawer.Item
        label="My Profile"
        active={active === 'Profile'}
        onPress={() => {
          setActive('Profile');
          navigation.navigate('User', { screen: 'User Profile' });
        }}
        icon="account"
      />
      <Drawer.Item
        label="My Orders"
        active={active === 'Orders'}
        onPress={() => {
          setActive('Orders');
          navigation.navigate('User', { screen: 'Order History' });
        }}
        icon="cart-variant"
      />
      <Drawer.Item
        label="Wishlist"
        active={active === 'Wishlist'}
        onPress={() => {
          setActive('Wishlist');
          navigation.navigate('Wishlist');
        }}
        icon="heart"
      />

      {isAdmin && (
        <Drawer.Item
          label="Admin Dashboard"
          active={active === 'Admin'}
          onPress={() => {
            setActive('Admin');
            navigation.navigate('Admin');
          }}
          icon="shield-admin"
        />
      )}

      <Drawer.Item
        label="Notifications"
        active={active === 'Notifications'}
        onPress={() => {
          setActive('Notifications');
          navigation.navigate('User', { screen: 'Notifications' });
        }}
        icon="bell"
      />
    </Drawer.Section>
  );
};

export default DrawerContent;