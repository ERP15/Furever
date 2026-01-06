import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'


import ProductContainer from './Screens/Product/ProductContainer'
import HomeNavigator from './Navigators/HomeNavigator';
import Header from './Shared/Header';
import Main from './Navigators/Main';
import { Provider as PaperProvider } from 'react-native-paper';
export default function App() {
  return (
    <NavigationContainer>
      <PaperProvider>
        {/* <View style={styles.container}> */}
        <Header />
        {/* <ProductContainer /> */}
        <Main />
        {/* </View> */}
      </PaperProvider>
    </NavigationContainer>
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
