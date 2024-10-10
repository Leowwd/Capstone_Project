import React from "react";
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { COLORS } from "./theme";

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const NameItem = ({ children }) => (
  <View style={styles.nameItem}>
    <Text style={styles.nameText}>{children}</Text>
  </View>
);

export default function CreditScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>音無虛發</Text>

        <Section title="指導教授">
          <NameItem style={{ color: "black" }}>楊傳凱 教授</NameItem>
        </Section>

        <Section title="組員名稱">
          <NameItem>廖偉菖</NameItem>
          <NameItem>白昀立</NameItem>
          <NameItem>張宥閎</NameItem>
          <NameItem>曾慶倫</NameItem>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.primary,
    marginBottom: 30,
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
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: "center",
  },
  sectionContent: {
    alignItems: "center",
  },
  nameItem: {
    backgroundColor: COLORS.featureBackground,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  nameText: {
    fontSize: 18,
    color: COLORS.text,
  },
});
