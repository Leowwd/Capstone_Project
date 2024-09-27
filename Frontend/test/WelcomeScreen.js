import { View, Image, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "./theme";

export default function WelcomeScreen() {
  const WelcomeImg = require("..\\assets\\AI generate.png");
  const ring1padding = useSharedValue(0);
  const ring2padding = useSharedValue(0);

  const navigation = useNavigation();

  useEffect(() => {
    // ring1padding.value = 0;
    // ring2padding.value = 0;

    setTimeout(
      () => (ring1padding.value = withSpring(ring1padding.value + hp(5))),
      100
    );
    setTimeout(
      () => (ring2padding.value = withSpring(ring2padding.value + hp(5.5))),
      300
    );

    setTimeout(() => navigation.replace("Home"), 2500);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* logoImg with rings */}
      <Animated.View style={[styles.ring2, { padding: ring2padding }]}>
        <Animated.View style={[styles.ring1, { padding: ring1padding }]}>
          <Image
            source={WelcomeImg}
            style={{
              justifyContent: "center",
              alignContent: "center",
              width: hp(20),
              height: hp(20), // hp(): 避免跟著Animated.View一起改變大小
            }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ring1: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    // backgroundColor: "black",    // test
    borderRadius: 200,
  },
  ring2: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    // backgroundColor: "pink",    // test
    borderRadius: 200,
  },
});
