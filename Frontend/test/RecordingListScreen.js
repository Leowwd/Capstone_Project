import React, { useState, useCallback, useContext, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, Alert, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons'; 
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { manage_backgroundColor } from './manage_backgroundColor';


export default function RecordingListScreen() {
  const [recordingData, setRecordingData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  const [newName, setNewName] = useState('');
  const {isWhite} = useContext(manage_backgroundColor);
  const [expandedItems, setExpandedItems] = useState({});
  const [playingStates, setPlayingStates] = useState({});
  const [progress, setProgress] = useState({});
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({...prev, [index]: !prev[index]}));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
  };

  const formatDuration = (durationMillis) => {
    const totalSeconds = Math.floor(durationMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
      return () => {
        Object.values(playingStates).forEach(state => {
          if (state && state.sound) {
            state.sound.unloadAsync();
          }
        });
      };
    }, [])
  );

  async function loadRecordings() {
    try {
      const savedRecordings = await AsyncStorage.getItem('recordings');
      if (savedRecordings) {
        const parsedRecordings = JSON.parse(savedRecordings);
        // 如果錄音數據中沒有 duration，我們需要獲取它
        const updatedRecordings = await Promise.all(parsedRecordings.map(async (recording) => {
          
          if (!recording.date) {
            recording.date = new Date().toISOString(); // 使用當前日期
          }

          if (!recording.duration) {
            const info = await FileSystem.getInfoAsync(recording.uri);
            const sound = new Audio.Sound();
            await sound.loadAsync({ uri: recording.uri });
            const status = await sound.getStatusAsync();
            await sound.unloadAsync();
            recording.duration = status.durationMillis;
          }
          return recording;
        }));

        setRecordingData(updatedRecordings);
        setShowEmptyPrompt(updatedRecordings.length === 0);

      } else {
        setShowEmptyPrompt(true);
      }
    } catch (error) {
      console.error('加載錄音文件失敗', error);
      setShowEmptyPrompt(true);
    }
  }

  async function saveRecordings(newRecordings) {
    try {
      await AsyncStorage.setItem('recordings', JSON.stringify(newRecordings));
    } catch (error) {
      console.error('保存錄音文件失敗', error);
    }
  }

  async function playRecording(index) {
    try {
      const currentPlaying = playingStates[index];
      if (currentPlaying && currentPlaying.sound) {
        // 如果正在播放，則暫停
        await currentPlaying.sound.pauseAsync();
        setPlayingStates(prev => ({
          ...prev,
          [index]: { ...prev[index], isPlaying: false }
        }));
      } else {
        // 如果沒有播放，則開始播放
        // 卸載所有其他正在播放的音頻
        await Promise.all(Object.entries(playingStates).map(async ([key, value]) => {
          if (value && value.sound) {
            await value.sound.unloadAsync();
          }
        }));
        setPlayingStates({}); // 清空狀態
  
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: recordingData[index].uri });
  
        sound.setOnPlaybackStatusUpdate(async status => {
          if (status.isLoaded) {
            setProgress(prev => ({
              ...prev,
              [index]: status.positionMillis / status.durationMillis
            }));
            if (status.didJustFinish) {
              sound.unloadAsync();
              setPlayingStates(prev => ({ ...prev, [index]: null }));
              setProgress(prev => ({ ...prev, [index]: 0 }));
            }
          }
        });
  
        await sound.playAsync();
        setPlayingStates(prev => ({
          ...prev,
          [index]: { sound, isPlaying: true }
        }));
      }
    } catch (error) {
      console.error('播放錄音失敗', error);
    }
  }

  async function handleSharing(index) {
    try {
      const uri = recordingData[index].uri;

      const fileContents = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      
      const response = await fetch('http://127.0.0.1:8080/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: fileContents,
          index: index,
          threshold: 0.75
        }),
      });

      if (response.ok) {
        Alert.alert('成功', '錄音文件已成功上傳');
      } else {
        Alert.alert('失敗', '上傳錄音文件失敗');
      }

    } catch (error) {
      console.error('分享錄音失敗', error);
      Alert.alert('失敗', '分享錄音失敗');
    }
  }

  async function deleteRecording(index) {
    try {
      const newRecordingData = [...recordingData];
      await FileSystem.deleteAsync(newRecordingData[index].uri);
      newRecordingData.splice(index, 1);
      setRecordingData(newRecordingData);
      saveRecordings(newRecordingData);
  
      if (playingStates[index] && playingStates[index].sound) {
        await playingStates[index].sound.unloadAsync();
      }
      setPlayingStates(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[index];
        return newProgress;
      });
  
    } catch (error) {
      console.error('刪除錄音失敗', error);
    }
  }

  function startEditing(index) {
    setCurrentEditingIndex(index);
    setNewName(recordingData[index].name);
    setIsEditing(true);
  }

  function saveNewName() {
    const updatedRecordingData = [...recordingData];
    updatedRecordingData[currentEditingIndex].name = newName;
    setRecordingData(updatedRecordingData);
    saveRecordings(updatedRecordingData);
    setIsEditing(false);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isWhite ? '#ffffff' : '#171919' }]}>
      {showEmptyPrompt ? (
      <View style={styles.emptyPromptContainer}>
        <Text style={styles.emptyPromptText}>這裡空空如也~</Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {recordingData.map((recordingItem, index) => (
         <TouchableOpacity key={index} onPress={() => toggleExpand(index)}>
         <View style={styles.recordingText}>
           
           <View style={styles.recordingHeader}>
             <View style={styles.recordingInfo}>
               <Text style={styles.recordingText}>{recordingItem.name}</Text>
               <Text style={styles.recordingDate}>{formatDate(recordingItem.date)}</Text>
             </View>
             <Text style={styles.recordingDuration}>{formatDuration(recordingItem.duration)}</Text>
           </View>
           
           {expandedItems[index] && (
              <View style={styles.expandedContainer}>
                <Slider
                  style={{width: '100%', height: 40}}
                  minimumValue={0}
                  maximumValue={1}
                  value={progress[index] || 0}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#000000"
                />
                <View style={styles.expandedButtonsContainer}>
                  
                  <View style={styles.buttonGroup}>
                    
                    <TouchableOpacity onPress={() => startEditing(index)}>
                      <Ionicons name="pencil" size={30} color="#007AFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => playRecording(index)}>
                      <Ionicons 
                        name={playingStates[index]?.isPlaying ? "pause" : "play"} 
                        size={50} 
                        color="#007AFF" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => deleteRecording(index)}>
                      <Ionicons name="trash" size={30} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => handleSharing(index)} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={35} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
         <View style={styles.separator} />
       </TouchableOpacity>
     ))}
      </ScrollView>
    )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>編輯名稱</Text>
          <TextInput
            style={styles.input}
            onChangeText={setNewName}
            value={newName}
          />
          <TouchableOpacity onPress={saveNewName}>
            <Text style={styles.modalActionLink}>保存</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Text style={styles.modalActionLink}>取消</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    fontSize: 25,
    color: '#8E8E93',
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  recordingDuration: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionLink: {
    color: '#007AFF',
    fontSize: 17,
    marginRight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#C6C6C8',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
    width: '100%',
    fontSize: 17,
    paddingVertical: 10,
    marginBottom: 20,
  },
  modalActionLink: {
    color: '#007AFF',
    fontSize: 17,
    marginTop: 10,
  },
  emptyPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyPromptText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 10,
  },
  shareButton: {
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
