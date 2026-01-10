import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'


import ProductContainer from './Screens/Product/ProductContainer'
import HomeNavigator from './Navigators/HomeNavigator';
import Header from './Shared/Header';
import Main from './Navigators/Main';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import store from './Redux/store';
import Toast from 'react-native-toast-message';
export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <PaperProvider>
          {/* <View style={styles.container}> */}
          <Header />
          {/* <ProductContainer /> */}
          <Main />

          {/* </View> */}
        </PaperProvider>
      </NavigationContainer>
      <Toast />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
