// HomeScreen.js
import React, { useContext, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { manage_backgroundColor } from './manage_backgroundColor';

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const { isWhite } = useContext(manage_backgroundColor);

  useFocusEffect(
    React.useCallback(() => {
      // 重置動畫值
      fadeAnim.setValue(0);
      slideAnim.setValue(100);

      // 啟動動畫
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, slideAnim])
  );

  return (
    <Animated.View style={[styles.container, { backgroundColor: isWhite ? '#ffffff' : '#171919' }]}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>音無虛發</Animated.Text>
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('實作介面')}>
          <Text style={styles.buttonText}>開始測試</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 30,
    color: '#1a73e8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    backgroundColor: '#1a73e8',
    padding: 18,
    borderRadius: 30,
    width: 200,
    alignItems: 'center',
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
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
});
