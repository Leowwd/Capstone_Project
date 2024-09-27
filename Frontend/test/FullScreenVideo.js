import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';

const FullScreenVideo = ({ videoSource, onClose }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Video source:", videoSource); // 添加這行來檢查 videoSource
  }, [videoSource]);


  if (!videoSource) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>發生錯誤
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>關閉</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{uri:videoSource}}
          style={styles.video}
          resizeMode="contain"
          shouldPlay
          isLooping={false}
          useNativeControls
          onError={(error) => {
            console.error("影片播放错误:", error);
            setError(error);
          }}
        />
      </View>
      {error && <Text style={styles.errorText}>播放出錯: {error.message}</Text>}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>關閉</Text>
      </TouchableOpacity>
    </View>
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
    width: '80%', // 調整寬度百分比
    height: '80%', // 調整高度百分比
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
  },
});

export default FullScreenVideo;
