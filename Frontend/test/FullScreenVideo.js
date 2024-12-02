import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Video } from 'expo-av';

const FullScreenVideo = ({ videoSource, onClose }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          source={{ uri: videoSource }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay={true}
          isLooping={true}
          style={styles.video}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>關閉</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 100,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FullScreenVideo;
