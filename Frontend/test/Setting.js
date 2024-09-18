// Setting.js
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { manage_backgroundColor } from "./manage_backgroundColor";

export default function Setting() {
  const { isWhite, toggleBackgroundColor } = useContext(manage_backgroundColor);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isWhite ? "#ffffff" : "#171919" },
      ]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleBackgroundColor}
      >
        <Text style={styles.buttonText}>切換夜間模式</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    backgroundColor: "#1a73e8",
    padding: 18,
    borderRadius: 30,
    width: 200,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
});
