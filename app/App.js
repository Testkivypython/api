import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import './source/core/fontawesome';
import { useEffect } from 'react';
     
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import SplashScreen from './source/screens/Splash';
import SignInScreen from './source/screens/SignIn';
import SignUpScreen from './source/screens/SignUp';
import HomeScreen from './source/screens/Home';
import SearchScreen from './source/screens/Search';
import MessageScreen from './source/screens/Message';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import useGlobal from './source/core/global';

const Stack = createNativeStackNavigator();

const LightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: 'white',
    }    
}

export default function App() {
  const initialized = useGlobal((state) => state.initialized);  
  const authenticated = useGlobal((state) => state.authenticated);

  const init = useGlobal((state) => state.init);

  useEffect(() => {
    init();
  }, []);

  return (
    <NavigationContainer theme={LightTheme}>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator>
            {!initialized ? (
                <>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                </>
            ) : authenticated ? (
                <>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="Message" component={MessageScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                </>
            )} 
      </Stack.Navigator>
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
