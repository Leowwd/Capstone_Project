import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, FlatList, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { manage_backgroundColor } from './manage_backgroundColor';

export default function StartScreen({ navigation }) {
  const [audioData, setAudioData] = useState([]);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState(null);
  const [selectedExampleName, setSelectedExampleName] = useState('');
  const [currentSound, setCurrentSound] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const [exampleModalVisible, setexampleModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioSelected, setIsAudioSelected] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [recordingUri, setRecordingUri] = useState('');
  const [savedRecordingName, setSavedRecordingName] = useState('');

  const { isWhite } = useContext(manage_backgroundColor);

  useEffect(() => {
    let isMounted = true;

    async function fetchAudioData(retries = 3) {
      try {
        const response = await axios.get(
          "https://datasets-server.huggingface.co/rows?dataset=bookbot%2Fljspeech_phonemes&config=default&split=train&offset=0&length=100"
        );
        if (isMounted) {
          setAudioData(response.data.rows);
        }
      } catch (error) {
        console.error('Error fetching audio data', error);

        if (error.response) {
          console.error('Server responded with status:', error.response.status);
          if (error.response.status === 500 && retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);
            fetchAudioData(retries - 1);
          } else {
            console.error('Unable to fetch data after retries.');
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error:', error.message);
        }
      }
    }

    fetchAudioData();

    return () => {
      isMounted = false;
      if (currentSound !== null) {
        currentSound.stopAsync().then(() => {
          currentSound.unloadAsync();
        });
      }
    };
  }, []);

  async function playAudio() {
    if (!selectedAudioUrl) return;

    try {
      if (currentSound === null) {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: selectedAudioUrl },
          { shouldPlay: true },
          updatePlaybackStatus
        );
        setCurrentSound(sound);
        setPlaybackStatus(status);
        setIsPlaying(true);
      } else {
        if (playbackStatus && playbackStatus.isLoaded) {
          if (playbackStatus.isPlaying) {
            await currentSound.pauseAsync();
            setIsPlaying(false);
          } else {
            if (playbackStatus.positionMillis === playbackStatus.durationMillis) {
              await currentSound.replayAsync();
            } else {
              await currentSound.playAsync();
            }
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Playback failed', error);
    }
  }

  function updatePlaybackStatus(status) {
    setPlaybackStatus(status);
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }

  function handleExampleSelect(audioURL, text, exampleName) {
    setSelectedAudioUrl(audioURL);
    setCurrentText(text);
    setSelectedExampleName(exampleName);
    setIsAudioSelected(true);
    setIsPlaying(false);
    if (currentSound) {
      currentSound.stopAsync().then(() => {
        currentSound.unloadAsync();
        setCurrentSound(null);
      });
    }
    setexampleModalVisible(false);
  }

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  }

  async function stopRecording() {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      setNameModalVisible(true);
    } catch (error) {
      console.error('Saving recording failed', error);
    }
  }

  async function saveRecording(name) {
    try {
      const info = await FileSystem.getInfoAsync(recordingUri);
      const newUri = `${FileSystem.documentDirectory}recording${new Date().getTime()}.wav`;

      await FileSystem.moveAsync({
        from: info.uri,
        to: newUri,
      });

      const savedRecordings = await AsyncStorage.getItem('recordings');
      const recordingData = savedRecordings ? JSON.parse(savedRecordings) : [];
      const newData = [...recordingData, { uri: newUri, name }];
      await AsyncStorage.setItem('recordings', JSON.stringify(newData));

      setSavedRecordingName(name);
      setNameModalVisible(false);
      alert(`錄音 "${name}" saved`);
    } catch (error) {
      console.error('Saving recording failed', error);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isWhite ? '#ADD8E6' : '#171919' }]}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.fixedExampleContainer}>
          <TouchableOpacity style={styles.selectButton} onPress={() => setexampleModalVisible(true)}>
            <Text style={styles.selectButtonText}>選取範例</Text>
          </TouchableOpacity>

          <Text style={styles.exampleText}>範例: {selectedExampleName}</Text>

          <ScrollView style={styles.textScrollView}>
            <Text style={styles.selectedText}>{currentText}</Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.playButton, !isAudioSelected && styles.disabledButton]}
              onPress={playAudio}
              disabled={!isAudioSelected}
            >
              <Text style={styles.buttonText}>{isPlaying ? '暫停' : '播放'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recordingContainer}>
          <TouchableOpacity
            style={isRecording ? styles.pressedButton : styles.recordButton}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={isRecording ? styles.innerButtonPressed : styles.innerButton} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('最近錄音')}
          >
            <Text style={styles.buttonText}>查看錄音</Text>
          </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={exampleModalVisible}
        onRequestClose={() => setexampleModalVisible(false)}
      >
        <View style={styles.modalView}>
          <FlatList
            data={audioData}
            keyExtractor={(item) => item.row.audio[0].src}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.audioItem}
                onPress={() => handleExampleSelect(item.row.audio[0].src, item.row.text, item.row.id)}
              >
                <Text style={styles.audioItemText}>{item.row.id}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={nameModalVisible}
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>請輸入錄音名稱：</Text>
            <TextInput
              style={styles.textInput}
              value={recordingName}
              onChangeText={setRecordingName}
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => saveRecording(recordingName)}
            >
              <Text style={styles.buttonText}>儲存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setNameModalVisible(false)}
            >
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 0,
  },
  fixedExampleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  selectButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  exampleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: "#fff",
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  textScrollView: {
    height: 200,
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  selectedText: {
    fontSize: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  playButton: {
    backgroundColor: '#28a745',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 25,
  },
  recordingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 40,
  },
  recordButton: {
    backgroundColor: '#dc3545',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pressedButton: {
    backgroundColor: '#ffffff',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  innerButton: {
    backgroundColor: '#fff',
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  innerButtonPressed: {
    backgroundColor: '#ff0000',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  manageButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  audioItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginVertical: 5,
    width: 200,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  audioItemText: {
    fontSize: 20,
    color: '#343a40',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#808080',
    padding: 10,
    borderRadius: 5,
    width: 200,
    marginBottom: 10,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  actionButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 5, // Android 立體效果
    shadowColor: '#000', // iOS 立體效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});