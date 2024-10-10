import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";

const steps = [
  {
    title: "步驟 1",
    description: "利用播放按鈕「左方」的按鈕選擇欲練習音檔",
  },
  {
    title: "步驟 2",
    description:
      "錄音後可從下方列表查看最近完成的錄音\n\n" + " - 點按名稱可以修改錄音",
  },
  { title: "步驟 3", description: "使用綠色懸浮按鈕送出結果" },
  {
    title: "Bonus",
    description: "設定頁面可以調整難度，增強語音的辨識嚴格程度",
  },
];

const StepItem = ({ title, description }) => (
  <View style={styles.stepItem}>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
  </View>
);

const UsageGuideScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>使用說明</Text>
        {steps.map((step, index) => (
          <StepItem
            key={index}
            title={step.title}
            description={step.description}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  stepItem: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#007AFF",
  },
  stepDescription: {
    fontSize: 16,
    color: "#333",
  },
});

export default UsageGuideScreen;
