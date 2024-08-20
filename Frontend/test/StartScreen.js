import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, FlatList, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { manage_backgroundColor } from './manage_backgroundColor';
import { COLORS, FONTS } from './theme';
// import Guide from './GuideOverlay';


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

  // const [showGuide, setShowGuide] = useState(true);
  // const [guideStep, setGuideStep] = useState(0);

  // const handleNextGuide = () => {
  //   setGuideStep(prevStep => prevStep + 1);
  // };
  
  // const handleCloseGuide = () => {
  //   setShowGuide(false);
  // };

  // useEffect(() => {
  //   const checkFirstTime = async () => {
  //     const hasShownGuide = await AsyncStorage.getItem('hasShownGuide');
  //     if (hasShownGuide === null) {
  //       setShowGuide(true);
  //       await AsyncStorage.setItem('hasShownGuide', 'true');
  //     } else {
  //       setShowGuide(false);
  //     }
  //   };
  
  //   checkFirstTime();
  // }, []);

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
    <LinearGradient
      colors={isWhite ? [COLORS.lightBg1, COLORS.lightBg2] : [COLORS.darkBg1, COLORS.darkBg2]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.fixedExampleContainer}>
            <TouchableOpacity style={styles.selectButton} onPress={() => setexampleModalVisible(true)}>
              <Ionicons name="list" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.selectButtonText}>選取範例</Text>
            </TouchableOpacity>

            <Text style={[styles.exampleText, { color: isWhite ? COLORS.darkText : COLORS.lightText }]}>
              範例: {selectedExampleName}
            </Text>

            <ScrollView style={styles.textScrollView}>
              <Text style={[styles.selectedText, { color: isWhite ? COLORS.darkText : COLORS.lightText }]}>
                {currentText}
              </Text>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.playButton, !isAudioSelected && styles.disabledButton]}
                onPress={playAudio}
                disabled={!isAudioSelected}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" style={styles.buttonIcon} />
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
          
          <View style={styles.manageButtonContainer}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('最近錄音')}
            >
              <Ionicons name="folder-open" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>查看錄音</Text>
            </TouchableOpacity>
          </View>
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
        
        {/* {showGuide && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <Guide
            step={guideStep}
            onNext={handleNextGuide}
            onClose={handleCloseGuide}
          />
        </View>
      )} */}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
  },
  fixedExampleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 10,
  },
  selectButtonText: {
    color: 'white',
    ...FONTS.button,
  },
  exampleText: {
    ...FONTS.h2,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textScrollView: {
    height: 200,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedText: {
    ...FONTS.body,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    elevation: 2,
    shadowOpacity: 0.15,
  },
  buttonText: {
    color: 'white',
    ...FONTS.button,
  },
  recordingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  recordButton: {
    backgroundColor: 'red',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pressedButton: {
    backgroundColor: 'white',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  innerButton: {
    backgroundColor: 'white',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  innerButtonPressed: {
    backgroundColor: 'red',
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  manageButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    ...FONTS.button,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  audioItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    width: 300,
    borderRadius: 10,
    alignItems: 'center',
  },
  audioItemText: {
    ...FONTS.body,
    color: 'black',
  },
  modalText: {
    ...FONTS.h2,
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    width: 250,
    marginBottom: 15,
    ...FONTS.body,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});