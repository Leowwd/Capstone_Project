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
import axios from "axios";
// import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { manage_backgroundColor } from "./manage_backgroundColor";
import { COLORS, FONTS } from "./theme";
import Advice from "./advice";
import { useThreshold } from "./ThresholdContext";

export default function RecordingListScreen({ navigation }) {
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
  const [isAnyItemExpanded, setIsAnyItemExpanded] = useState(false);
  const [currentExpandedIndex, setCurrentExpandedIndex] = useState(null);
  const [savedAnalysisResults, setSavedAnalysisResults] = useState({});

  const { threshold } = useThreshold();

  const toggleExpand = (index) => {
    setExpandedItems((prev) => {
      const updatedState = {};
      Object.keys(prev).forEach((key) => {
        updatedState[key] = false;
      });
      updatedState[index] = !prev[index];

      setCurrentExpandedIndex(updatedState[index] ? index : null);

      const hasExpanded = Object.values(updatedState).some((value) => value);
      setIsAnyItemExpanded(hasExpanded);
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
      const savedResults = await AsyncStorage.getItem("analysisResults");
      
      if (savedResults) {
        setSavedAnalysisResults(JSON.parse(savedResults));
      }
      
      if (savedRecordings) {
        const parsedRecordings = JSON.parse(savedRecordings);
        const updatedRecordings = await Promise.all(
          parsedRecordings.map(async (recording) => {
            try {
              if (!recording.date) {
                recording.date = new Date().toISOString();
              }

              if (!recording.duration) {
                const info = await FileSystem.getInfoAsync(recording.uri);
                if (!info.exists) {
                  console.warn(`文件不存在：${recording.uri}`);
                  return null;
                }
                
                const sound = new Audio.Sound();
                try {
                  await sound.loadAsync({ uri: recording.uri });
                  const status = await sound.getStatusAsync();
                  recording.duration = status.durationMillis;
                  await sound.unloadAsync();
                } catch (error) {
                  console.warn(`音頻加載失敗：${error.message}`);
                  return null;
                }
              }
              return recording;
            } catch (error) {
              console.warn(`處理錄音失敗：${error.message}`);
              return null;
            }
          })
        );

        const validRecordings = updatedRecordings.filter(recording => recording !== null);
        setRecordingData(validRecordings);
        setShowEmptyPrompt(validRecordings.length === 0);
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
      const recording = recordingData[index];
      if (!recording || !recording.uri) {
        console.warn('無效的錄音數據');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(recording.uri);
      if (!fileInfo.exists) {
        console.warn('錄音文件不存在');
        return;
      }

      const currentPlaying = playingStates[index];
      if (currentPlaying && currentPlaying.sound) {
        if (currentPlaying.isPlaying) {
          // 暫停播放
          await currentPlaying.sound.pauseAsync();
          setPlayingStates((prev) => ({
            ...prev,
            [index]: { ...prev[index], isPlaying: false },
          }));
        } else {
          // 恢復播放
          await currentPlaying.sound.playAsync();
          setPlayingStates((prev) => ({
            ...prev,
            [index]: { ...prev[index], isPlaying: true },
          }));
          updateProgress(currentPlaying.sound, index);
        }
      } else {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: recording.uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate(index)
        );
        setPlayingStates((prev) => ({
          ...prev,
          [index]: { sound, isPlaying: true },
        }));
        updateProgress(sound, index);
      }
    } catch (error) {
      console.error("播放錄音失敗", error);
      Alert.alert("錯誤", "無法播放該錄音");
    }
  }

  // 新增的進度更新函數
  const onPlaybackStatusUpdate = (index) => (status) => {
    if (status.isLoaded && status.isPlaying) {
      const progress = status.positionMillis / status.durationMillis;
      setProgress((prev) => ({
        ...prev,
        [index]: progress,
      }));
    }
    
    // 播放結束時重置狀態
    if (status.didJustFinish) {
      setPlayingStates((prev) => ({
        ...prev,
        [index]: { ...prev[index], isPlaying: false },
      }));
      setProgress((prev) => ({
        ...prev,
        [index]: 0,
      }));
    }
  };

  // 新增的進度更新控制函數
  const updateProgress = async (sound, index) => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate(index));
      }
    } catch (error) {
      console.error("更新進度失敗", error);
    }
  };

  async function handleSharing() {
    if (currentExpandedIndex === null) return;
    try {
      const uri = recordingData[currentExpandedIndex].uri;

      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prepare the data to send
      const data = {
        audio_base64: base64Audio,
        index: recordingData[currentExpandedIndex].exampleIndex,
        threshold: threshold,
      };

      // Send to backend
      const response = await axios.post(
        "http://192.168.0.79:8080/upload",
        data
      );

      // console.log("Audio sent successfully:", response.data);

      // 保存分析結果
      await saveAnalysisResult(currentExpandedIndex, response.data);
      setAdviceData(response.data);

      Alert.alert(
        "分析完成",
        "請查看分析結果",
        [{ text: "確定", onPress: () => setShowAdvice(true) }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("處理錄音失敗", error);
    }
  }

  async function deleteRecording(index) {
    try {
      // 刪除錄音文件
      const newRecordingData = [...recordingData];
      const fileUri = newRecordingData[index].uri;
      
      // 檢查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (deleteError) {
          console.warn("刪除文件失敗:", deleteError);
          // 即使刪除失敗也繼續執行
        }
      }

      // 更新錄音數據
      newRecordingData.splice(index, 1);
      setRecordingData(newRecordingData);
      saveRecordings(newRecordingData);

      // 處理播放狀態
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

      // 處理分析結果
      const newSavedResults = { ...savedAnalysisResults };
      // 刪除當前索引的結果
      delete newSavedResults[index];
      // 重新排序後面的結果
      Object.keys(newSavedResults)
        .map(Number)
        .filter(key => key > index)
        .forEach(key => {
          newSavedResults[key - 1] = newSavedResults[key];
          delete newSavedResults[key];
        });
      
      // 更新 AsyncStorage 和狀態
      await AsyncStorage.setItem("analysisResults", JSON.stringify(newSavedResults));
      setSavedAnalysisResults(newSavedResults);

    } catch (error) {
      console.error("刪除錄音失敗", error);
      Alert.alert(
        "錯誤",
        "刪除錄音時發生錯誤，請稍後再試",
        [{ text: "確定", style: "default" }]
      );
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

  async function saveAnalysisResult(index, result) {
    try {
      const newResults = {
        ...savedAnalysisResults,
        [index]: result
      };
      await AsyncStorage.setItem("analysisResults", JSON.stringify(newResults));
      setSavedAnalysisResults(newResults);
    } catch (error) {
      console.error("保存分析結果失敗", error);
    }
  }

  function showSavedAnalysis(index) {
    setAdviceData(savedAnalysisResults[index]);
    setShowAdvice(true);
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
                      <View style={styles.nameContainer}>
                        <Text style={styles.recordingText}>
                          {recordingItem.name}
                        </Text>
                        {savedAnalysisResults[index] && (
                          <Text style={styles.analyzedTag}>已分析</Text>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => startEditing(index)}>
                        <View style={styles.nameContainer}>
                          <Text style={styles.recordingText}>
                            {recordingItem.name}
                          </Text>
                          {savedAnalysisResults[index] && (
                            <Text style={styles.analyzedTag}>已分析</Text>
                          )}
                        </View>
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
                      onValueChange={(value) => {
                        setProgress((prev) => ({
                          ...prev,
                          [index]: value,
                        }));
                      }}
                      onSlidingComplete={async (value) => {
                        const currentPlaying = playingStates[index];
                        if (currentPlaying && currentPlaying.sound) {
                          const status = await currentPlaying.sound.getStatusAsync();
                          const newPosition = value * status.durationMillis;
                          await currentPlaying.sound.setPositionAsync(newPosition);
                        }
                      }}
                    />
                    {/* 在Slider下面顯示進度的時間 */}
                    <View style={styles.Duration}>
                      <Text
                        style={{
                          color: isWhite ? "#000000" : "#FFFFFF",
                          fontSize: 16,
                        }}
                      >
                        {formatDuration(
                          progress[index] * recordingData[index].duration || 0
                        )}
                      </Text>
                      <Text
                        style={{
                          color: isWhite ? "#000000" : "#FFFFFF",
                          fontSize: 16,
                          textAlign: "right",
                        }}
                      >
                        {formatDuration(recordingItem.duration)}
                      </Text>
                    </View>

                    <View style={styles.expandedButtonsContainer}>
                      <View style={styles.buttonGroup}>
                        {/* <TouchableOpacity
                          onPress={() => handleSharing(index)}
                          style={styles.actionBtn}
                        >
                          <Ionicons
                            name="share-outline"
                            size={30}
                            color="#007AFF"
                          />
                        </TouchableOpacity> */}
                        <TouchableOpacity
                          onPress={() => playRecording(index)}
                          style={styles.actionBtn}
                        >
                          <Ionicons
                            name={
                              playingStates[index]?.isPlaying ? "pause" : "play"
                            }
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

      {isAnyItemExpanded && (
        <View style={styles.uploadContainer}>
          {/* <TouchableOpacity style={styles.uploadButton} onPress={handleSharing}>
            <Text style={styles.uploadButtonText}>送出分析</Text>
          </TouchableOpacity> */}
          {savedAnalysisResults[currentExpandedIndex] ? (
            <TouchableOpacity 
              style={[styles.uploadButton, styles.viewResultButton]}
              onPress={() => showSavedAnalysis(currentExpandedIndex)}
            >
              <Text style={styles.uploadButtonText}>查看分析結果</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleSharing}
            >
              <Text style={styles.uploadButtonText}>送出分析</Text>
            </TouchableOpacity>
          )}
        </View>
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
              placeholder="輸入新名稱"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={saveNewName}
              >
                <Text style={styles.modalButtonText}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
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
  Duration: {
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
    width: '85%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
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
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.secondary,
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
  uploadContainer: {
    position: "absolute",
    bottom: 60, // 在 BottomTab 上方
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
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
  uploadButtonText: {
    color: "white",
    fontSize: 18,
    ...FONTS.button,
  },
  viewResultButton: {
    backgroundColor: COLORS.primary, // 使用不同的顏色區分
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzedTag: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
