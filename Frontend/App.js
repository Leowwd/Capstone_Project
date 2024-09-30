// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import HomeScreen from "./test/HomeScreen";
import RecordingListScreen from "./test/RecordingListScreen";
import StartScreen from "./test/StartScreen";
import Setting from "./test/Setting";
import { BackgroundColorProvider } from "./test/manage_backgroundColor";
import WelcomeScreen from "./test/WelcomeScreen";
import { Ionicons } from "@expo/vector-icons";
import FullScreenVideo from "./test/FullScreenVideo";

const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();
const BottomTab = createBottomTabNavigator();

function MainStack() {
  return (
    <BottomTab.Navigator
      initialRouteName=""
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1a73e8",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* 主要功能 */}
      <BottomTab.Screen
        name="錄音"
        component={StartScreen}
        options={{
          headerBackVisible: true,
          tabBarIcon: () => <Ionicons name="mic-outline" size={20} />,
          tabBarActiveTintColor: "#1a73e8",
        }}
      />
      <BottomTab.Screen
        name="最近錄音"
        component={RecordingListScreen}
        options={{
          tabBarIcon: () => <Ionicons name="time-outline" size={20} />,
          tabBarActiveTintColor: "#1a73e8",
        }}
      />
      <BottomTab.Screen
        name="設定"
        component={Setting}
        options={{
          tabBarIcon: () => <Ionicons name="settings-outline" size={20} />,
          tabBarActiveTintColor: "#1a73e8",
        }}
      />
    </BottomTab.Navigator>
  );
}

export default function App() {
  return (
    <BackgroundColorProvider>
      <NavigationContainer style={styles}>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1a73e8",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Main"
            component={MainStack}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BackgroundColorProvider>
  );
}
const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: "#1a73e8",
  },
  headerTintColor: "#fff",
  headerTitleStyle: {
    fontWeight: "bold",
  },
});
