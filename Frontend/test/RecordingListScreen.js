import React, { useState, useCallback, useContext, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import axios from 'axios';
// import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { manage_backgroundColor } from "./manage_backgroundColor";
import Advice from "./advice"; 

export default function RecordingListScreen({navigation}) {
  const [recordingData, setRecordingData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  const [newName, setNewName] = useState("");
  const { isWhite } = useContext(manage_backgroundColor);
  const [expandedItems, setExpandedItems] = useState({});
  const [playingStates, setPlayingStates] = useState({});
  const [progress, setProgress] = useState({});
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
  const [adviceData, setAdviceData] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);

  const toggleExpand = (index) => {
    setExpandedItems((prev) => {
      const updatedState = {};
      Object.keys(prev).forEach((key) => {
        updatedState[key] = false;
      });
      updatedState[index] = !prev[index];
      return updatedState;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}月${date.getDate().toString().padStart(2, "0")}日`;
  };

  const formatDuration = (durationMillis) => {
    const totalSeconds = Math.floor(durationMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
      return () => {
        Object.values(playingStates).forEach((state) => {
          if (state && state.sound) {
            state.sound.unloadAsync();
          }
        });
      };
    }, [])
  );

  async function loadRecordings() {
    try {
      const savedRecordings = await AsyncStorage.getItem("recordings");
      if (savedRecordings) {
        const parsedRecordings = JSON.parse(savedRecordings);
        const updatedRecordings = await Promise.all(
          parsedRecordings.map(async (recording) => {
            if (!recording.date) {
              recording.date = new Date().toISOString();
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
          })
        );

        setRecordingData(updatedRecordings);
        setShowEmptyPrompt(updatedRecordings.length === 0);
      } else {
        setShowEmptyPrompt(true);
      }
    } catch (error) {
      console.error("加載錄音文件失敗", error);
      setShowEmptyPrompt(true);
    }
  }

  async function saveRecordings(newRecordings) {
    try {
      await AsyncStorage.setItem("recordings", JSON.stringify(newRecordings));
    } catch (error) {
      console.error("保存錄音文件失敗", error);
    }
  }

  async function playRecording(index) {
    try {
      const currentPlaying = playingStates[index];
      if (currentPlaying && currentPlaying.sound) {
        if (currentPlaying.isPlaying) {
          // 如果正在播放，則暫停
          await currentPlaying.sound.pauseAsync();
          setPlayingStates((prev) => ({
            ...prev,
            [index]: { ...prev[index], isPlaying: false },
          }));
        } else {
          // 如果已暫停，則恢復播放
          await currentPlaying.sound.playAsync();
          setPlayingStates((prev) => ({
            ...prev,
            [index]: { ...prev[index], isPlaying: true },
          }));
        }
      } else {
        // 如果沒有播放，則開始播放
        // 卸載所有其他正在播放的音頻
        await Promise.all(
          Object.entries(playingStates).map(async ([key, value]) => {
            if (value && value.sound) {
              await value.sound.unloadAsync();
            }
          })
        );
        setPlayingStates({}); // 清空狀態
  
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: recordingData[index].uri });
  
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded) {
            setProgress((prev) => ({
              ...prev,
              [index]: status.positionMillis / status.durationMillis,
            }));
            if (status.didJustFinish) {
              sound.unloadAsync();
              setPlayingStates((prev) => ({ ...prev, [index]: null }));
              setProgress((prev) => ({ ...prev, [index]: 0 }));
            }
          } else if (status.error) {
            console.error(`Audio播放錯誤: ${status.error}`);
          }
        });
  
        await sound.playAsync();
        setPlayingStates((prev) => ({
          ...prev,
          [index]: { sound, isPlaying: true },
        }));
      }
    } catch (error) {
      console.error("播放錄音失敗", error);
    }
  }

  async function handleSharing(index) {
    try {
      const uri = recordingData[index].uri;
      
      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Prepare the data to send
      const data = {
        audio_base64: base64Audio,
        index: recordingData[index].exampleIndex,
        threshold: 0.4,
      };
      
      // Send to backend
      const response = await axios.post('http://172.20.10.11:8080/upload', data);
      
      console.log('Audio sent successfully:', response.data);
      setAdviceData(response.data);

      Alert.alert(
        "傳出成功",
        "請稍後解析...",
        [
          {
            text: "確定",
            onPress: () => setShowAdvice(true),
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error("處理錄音失敗", error);
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
      setPlayingStates((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[index];
        return newProgress;
      });
    } catch (error) {
      console.error("刪除錄音失敗", error);
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
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isWhite ? "#ffffff" : "#171919" },
      ]}
    >
      {showEmptyPrompt ? (
        <View style={styles.emptyPromptContainer}>
          <Text style={styles.emptyPromptText}>這裡空空如也~</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {recordingData.map((recordingItem, index) => (
            <TouchableOpacity key={index} onPress={() => toggleExpand(index)}>
              <View style={styles.recordingText}>
                {/* 常駐show出 */}
                <View style={styles.recordingHeader}>
                  <View style={styles.recordingInfo}>
                    {!expandedItems[index] ? (
                      <Text style={styles.recordingText}>
                        {recordingItem.name}
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={() => startEditing(index)}>
                        <Text style={styles.recordingText}>
                          {recordingItem.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.recordingDate}>
                      {formatDate(recordingItem.date)}
                    </Text>
                  </View>
                  <Text style={styles.recordingDuration}>
                    {formatDuration(recordingItem.duration)}
                  </Text>
                </View>

                {/* 如果有expand的話才show出 */}
                {expandedItems[index] && (
                  <View style={styles.expandedContainer}>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={1}
                      value={progress[index] || 0}
                      minimumTrackTintColor="#007AFF"
                      maximumTrackTintColor="#000000"
                      // 添加 onValueChange 來實時更新進度顯示
                    />
                    {/* 在Slider下面顯示進度的時間 */}
                    <View style={styles.Duration}>
                      <Text style={{ color: isWhite ? "#000000" : "#FFFFFF", fontSize: 16 }}>
                        {formatDuration(progress[index] * recordingData[index].duration || 0)}
                      </Text>
                      <Text style={{ color: isWhite ? "#000000" : "#FFFFFF", fontSize: 16, textAlign: "right" }}>
                        {formatDuration(recordingItem.duration)}
                      </Text>
                    </View>
                    
                    <View style={styles.expandedButtonsContainer}>
                      <View style={styles.buttonGroup}>
                        <TouchableOpacity
                          onPress={() => handleSharing(index)}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="share-outline" size={30} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => playRecording(index)}
                          style={styles.actionBtn}
                        >
                          <Ionicons
                            name={playingStates[index]?.isPlaying ? "pause" : "play"}
                            size={30}
                            color="#007AFF"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteRecording(index)}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="trash" size={30} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.separator} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}


      {showAdvice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAdvice}
          onRequestClose={() => setShowAdvice(false)}
        >
          <Advice data={adviceData} onClose={() => setShowAdvice(false)} />
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.centeredView}>
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
  },
  recordingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    fontSize: 25,
    color: "#8E8E93",
    marginVertical: 4,
  },
  recordingDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  recordingDuration: {
    fontSize: 15,
    color: "#8E8E93",
    marginLeft: 10,
  },
  Duration:{
    flexDirection: "row", 
    justifyContent: "space-between",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionLink: {
    color: "#007AFF",
    fontSize: 17,
    marginRight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#C6C6C8",
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#C6C6C8",
    width: "100%",
    fontSize: 17,
    paddingVertical: 10,
    marginBottom: 20,
  },
  modalActionLink: {
    color: "#007AFF",
    fontSize: 17,
    marginTop: 10,
  },
  emptyPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyPromptText: {
    fontSize: 18,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 10,
  },
  shareButton: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    padding: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
