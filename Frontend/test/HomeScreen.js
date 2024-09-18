import React, { useContext, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { manage_backgroundColor } from "./manage_backgroundColor";
import { COLORS, FONTS } from "./theme";

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const { isWhite } = useContext(manage_backgroundColor);

  // navigation.reset({
  //   index: 0,
  //   routes: [{ name: "首頁" }],
  // });

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
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Main")}
        >
          <Ionicons
            name="mic-outline"
            size={24}
            color="white"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </Animated.View>
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
    ...FONTS.h1,
    marginBottom: 50,
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    ...FONTS.button,
  },
});
