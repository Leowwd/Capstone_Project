import React, { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal } from "react-native";
import { manage_backgroundColor } from "./manage_backgroundColor";
import { useThreshold } from "./ThresholdContext";
import { COLORS } from "./theme";

export default function Setting() {
  const { isWhite, toggleBackgroundColor } = useContext(manage_backgroundColor);
  const { threshold, setThreshold } = useThreshold();
  const [modalVisible, setModalVisible] = useState(false);

  const updateThreshold = (newThreshold) => {
    setThreshold(newThreshold);
    setModalVisible(false);
  };

  const getDifficultyText = () => {
    if (threshold === 0.2) return "初級";
    if (threshold === 0.4) return "中級";
    if (threshold === 0.6) return "中高級";
    if (threshold === 0.8) return "高級";
  };

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

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>選擇難度</Text>
      </TouchableOpacity>

      <Text
        style={[styles.difficultyText, { color: isWhite ? "#000" : "#fff" }]}
      >
        當前難度: {getDifficultyText()}
      </Text>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                updateThreshold(0.2);
              }}
            >
              <Text style={styles.modalButtonText}>初級</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                updateThreshold(0.4);
              }}
            >
              <Text style={styles.modalButtonText}>中級</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                updateThreshold(0.6);
              }}
            >
              <Text style={styles.modalButtonText}>中高級</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                updateThreshold(0.8);
                console.log(threshold);
              }}
            >
              <Text style={styles.modalButtonText}>高級</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: COLORS.secondary },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>取消</Text>
            </TouchableOpacity>
            <Text />
            <Text>難度調整會影響分析嚴格程度</Text>
          </View>
        </View>
      </Modal>
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
  difficultyText: {
    fontSize: 18,
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
    width: 150,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
