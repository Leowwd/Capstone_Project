import React, { useContext, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  View,
  Image,
  ImageBackground,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { manage_backgroundColor } from "./manage_backgroundColor";
import { COLORS, FONTS } from "./theme";
import MainFunctionBtn from "./MainFunctionBtn";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const { isWhite } = useContext(manage_backgroundColor);

  useFocusEffect(
    React.useCallback(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(100);
      };
    }, [fadeAnim, slideAnim])
  );

  return (
    <LinearGradient
      // 設定淺色、深色模式背景漸層
      colors={
        isWhite
          ? [COLORS.lightBg1, COLORS.lightBg2]
          : [COLORS.darkBg1, COLORS.darkBg2]
      }
      style={styles.container}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <SafeAreaView>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                color: isWhite ? COLORS.darkText : COLORS.lightText,
              },
            ]}
          >
            音無虛發
          </Animated.Text>
          <View style={styles.buttonContainer}>
            <MainFunctionBtn
              iconName="mic-outline"
              text="開始練習"
              path="Main"
            />
            <MainFunctionBtn
              iconName="help-outline"
              text="Guide"
              path="Guide"
            />
          </View>
          <View style={[styles.buttonContainer, { marginTop: 0 }]}>
            <MainFunctionBtn
              iconName="information-circle-outline"
              text="About"
              path="About"
            />
            <MainFunctionBtn
              iconName="trophy-outline"
              text="Credit"
              path="Credit"
            />
          </View>
        </SafeAreaView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Arial",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
});
