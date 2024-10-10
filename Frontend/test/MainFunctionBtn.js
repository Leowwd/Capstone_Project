import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import { React, useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "./theme";
import { manage_backgroundColor } from "./manage_backgroundColor";
import { useNavigation } from "@react-navigation/native";

const MainFunctionBtn = (props) => {
  const { isWhite } = useContext(manage_backgroundColor);
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate(props.path)}
      >
        <Ionicons
          style={styles.iconContainer}
          name={props.iconName}
          size={30}
          color="white"
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.textStyle,
          {
            color: isWhite ? COLORS.darkText : COLORS.lightText,
          },
        ]}
      >
        {props.text}
      </Text>
    </View>
  );
};

export default MainFunctionBtn;

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textStyle: {
    fontSize: 15,
    fontWeight: "bold",
    paddingTop: 10,
  },
});
