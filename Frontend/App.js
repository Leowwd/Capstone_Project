// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StyleSheet } from 'react-native';
import HomeScreen from './test/HomeScreen';
import RecordingListScreen from './test/RecordingListScreen';
import StartScreen from './test/StartScreen';
import Setting from './test/Setting';
import { BackgroundColorProvider } from './test/manage_backgroundColor';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a73e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="首頁" component={HomeScreen} />
      <Stack.Screen name="實作介面" component={StartScreen}/>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <BackgroundColorProvider>
      <NavigationContainer style={styles}>
        <Drawer.Navigator initialRouteName="主頁面" 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a73e8',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
          <Drawer.Screen name="主頁面" component={MainStack} options={{ headerShown: false }} />
          <Drawer.Screen name="最近錄音" component={RecordingListScreen} />
          <Drawer.Screen name="設定" component={Setting} />
        </Drawer.Navigator>
      </NavigationContainer>
    </BackgroundColorProvider>
  );
}
const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: '#1a73e8',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
});
