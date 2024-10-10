import React from "react";
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { COLORS } from "./theme"; // 假設你有定義好的顏色和主題

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const FeatureItem = ({ children }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureText}>{children}</Text>
  </View>
);

export default function ProjectInfoScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>專案說明</Text>

        <Section title="說明">
          <Text style={styles.description}>
            隨著英語成為全球通用語言，發音準確性對於語言學習者，尤其是台灣學習者來說，是一大挑戰。雖然市面上有許多英語學習軟體，但多數僅著重詞彙與語法，缺乏針對發音部位和嘴型的專業指導。因此，開發一款專注於發音訓練的系統，幫助使用者從根本上解決發音問題，顯得尤為重要。
          </Text>
          <View style={styles.separator} />
          <Text style={styles.description}>
            這款軟體以發音部位和嘴型的訓練為核心，提供針對性練習和即時反饋，幫助使用者改善發音問題。系統透過動畫展示發音時的口腔結構，輔以標準發音的音檔對比，讓學習者直觀掌握正確的發音技巧，無論是兒童或成人都能從中受益。
          </Text>
        </Section>

        <Section title="軟體功能">
          <FeatureItem>
            1.
            發音對比分析：用戶錄製語音後，系統會將其與標準發音進行比對，找出差異並給予評分。
          </FeatureItem>
          <FeatureItem>
            2.
            口腔剖面動畫：系統提供可視化的發音部位和舌位示範，幫助用戶更準確地掌握發音方式。
          </FeatureItem>
          <FeatureItem>
            3.
            即時反饋：系統檢測用戶發音中的錯誤，並提供具體的改進建議，逐步提升用戶發音的精確度。
          </FeatureItem>
          <FeatureItem>
            4.
            循環學習模式：用戶可反覆練習錄音並即時查看進步情況，幫助他們持續改進發音。
          </FeatureItem>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: COLORS.text,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.primary,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginVertical: 10,
  },
  featureItem: {
    backgroundColor: COLORS.featureBackground,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
