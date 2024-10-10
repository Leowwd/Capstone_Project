// App.js
import { React, useContext } from "react";
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
import CreditScreen from "./test/CreditScreen";
import AboutScreen from "./test/AboutScreen";
import GuideScreen from "./test/GuideScreen";
import { manage_backgroundColor } from "./test/manage_backgroundColor.js";
import { ThresholdProvider } from "./test/ThresholdContext.js";

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function MainStack() {
  const { isWhite } = useContext(manage_backgroundColor);
  return (
    <BottomTab.Navigator
      initialRouteName=""
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1a73e8",
          height: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarActiveTintColor: isWhite ? "#000" : "#1a73e8",
        tabBarStyle: {
          backgroundColor: isWhite ? "#fff" : "#333",
        },
        headerBackVisible: true,
      }}
    >
      {/* 主要功能 */}
      <BottomTab.Screen
        name="錄音"
        component={StartScreen}
        options={{
          tabBarIcon: () => (
            <Ionicons
              name="mic-outline"
              size={20}
              color={isWhite ? "#000" : "#fff"}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="最近錄音"
        component={RecordingListScreen}
        options={{
          tabBarIcon: () => (
            <Ionicons
              name="time-outline"
              size={20}
              color={isWhite ? "#000" : "#fff"}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="設定"
        component={Setting}
        options={{
          tabBarIcon: () => (
            <Ionicons
              name="settings-outline"
              size={20}
              color={isWhite ? "#000" : "#fff"}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

export default function App() {
  return (
    <ThresholdProvider>
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
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="Main" component={MainStack} />
            <Stack.Screen name="Guide" component={GuideScreen} />
            <Stack.Screen name="Credit" component={CreditScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </BackgroundColorProvider>
    </ThresholdProvider>
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
