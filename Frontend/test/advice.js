import React, { useState, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Dimensions, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "./theme";
import { Asset } from 'expo-asset';
import { manage_backgroundColor } from "./manage_backgroundColor";
import FullScreenVideo from "./FullScreenVideo";
// import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

phoneme_map = {
  1: "aɪ", 2: "aʊ", 3: "b", 4: "d", 5: "d͡ʒ", 6: "eɪ", 7: "f", 
  8: "h", 9: "i", 10: "j", 11: "k", 12: "l", 13: "m", 14: "n", 
  15: "oʊ", 16: "p", 17: "s", 18: "t", 19: "t͡ʃ", 20: "u", 
  21: "v", 22: "w", 23: "z", 24: "æ", 25: "ð", 26: "ŋ", 
  27: "a", 28: "ɔ", 29: "ɔɪ", 30: "ə", 31: "ɚ", 32: "ɛ", 33: "ɡ", 
  34: "ɪ", 35: "ɹ", 36: "ʃ", 37: "ʊ", 38: "ʌ", 39: "ʒ", 40: "θ"
}

const videoSources = {
  '1': Asset.fromModule(require('../assets/animation/1.mp4')),
  '2': Asset.fromModule(require('../assets/animation/2.mp4')),
  '3': Asset.fromModule(require('../assets/animation/3.mp4')),
  '4': Asset.fromModule(require('../assets/animation/4.mp4')),
  '5': Asset.fromModule(require('../assets/animation/5.mp4')),
  '6': Asset.fromModule(require('../assets/animation/6.mp4')),
  '7': Asset.fromModule(require('../assets/animation/7.mp4')),
  '8': Asset.fromModule(require('../assets/animation/8.mp4')),
  '9': Asset.fromModule(require('../assets/animation/9.mp4')),
  '10': Asset.fromModule(require('../assets/animation/10.mp4')),
  '11': Asset.fromModule(require('../assets/animation/11.mp4')), 
  '12': Asset.fromModule(require('../assets/animation/12.mp4')),
  '13': Asset.fromModule(require('../assets/animation/13.mp4')),
  '14': Asset.fromModule(require('../assets/animation/14.mp4')),
  '15': Asset.fromModule(require('../assets/animation/15.mp4')),
  '16': Asset.fromModule(require('../assets/animation/16.mp4')),
  '17': Asset.fromModule(require('../assets/animation/17.mp4')),
  '18': Asset.fromModule(require('../assets/animation/18.mp4')),
  '19': Asset.fromModule(require('../assets/animation/19.mp4')),
  '20': Asset.fromModule(require('../assets/animation/20.mp4')),
  '21': Asset.fromModule(require('../assets/animation/21.mp4')),
  '22': Asset.fromModule(require('../assets/animation/22.mp4')),
  '23': Asset.fromModule(require('../assets/animation/23.mp4')),
  '24': Asset.fromModule(require('../assets/animation/24.mp4')),
  '25': Asset.fromModule(require('../assets/animation/25.mp4')),
  '26': Asset.fromModule(require('../assets/animation/26.mp4')),
  '27': Asset.fromModule(require('../assets/animation/27.mp4')),
  '28': Asset.fromModule(require('../assets/animation/28.mp4')),
  '29': Asset.fromModule(require('../assets/animation/29.mp4')),
  '30': Asset.fromModule(require('../assets/animation/30.mp4')),
  '31': Asset.fromModule(require('../assets/animation/31.mp4')),
  '32': Asset.fromModule(require('../assets/animation/32.mp4')),
  '33': Asset.fromModule(require('../assets/animation/33.mp4')),
  '34': Asset.fromModule(require('../assets/animation/34.mp4')),
  '35': Asset.fromModule(require('../assets/animation/35.mp4')),
  '36': Asset.fromModule(require('../assets/animation/36.mp4')),
  '37': Asset.fromModule(require('../assets/animation/37.mp4')),
  '38': Asset.fromModule(require('../assets/animation/38.mp4')),
  '39': Asset.fromModule(require('../assets/animation/39.mp4')),
  '40': Asset.fromModule(require('../assets/animation/40.mp4'))
};

export default function Advice({ data, onClose }) {
  const { isWhite } = useContext(manage_backgroundColor);
  
  const [showPhonemes, setShowPhonemes] = useState(false);
  const [showWeakPhonemes, setShowWeakPhonemes] = useState(false);
  const [selectedPhoneme, setSelectedPhoneme] = useState(null);
  const [errorType, setErrorType] = useState('missing');
  const [selectedWeakPhoneme, setSelectedWeakPhoneme] = useState(null);

  const [showVideo, setShowVideo] = useState(false);
  const [videoData, setVideoData] = useState(null);

  const accuracy = (parseFloat(data.ratio) * 100).toFixed(2);
  const accuracyValue = parseFloat(accuracy);

  

  useEffect(() => {
    async function loadAssets() {
      await Promise.all(Object.values(videoSources).map(asset => asset.downloadAsync()));
    }
    loadAssets();
  }, []);


  const getMsgState = () => {
    if (accuracyValue <= 15) return "你念得好爛";
    if (accuracyValue <= 50) return "還有進步空間";
    if (accuracyValue <= 80) return "你念得不錯";
    return "你真棒!";
  };

  const phonemeKeys = Object.keys(data.feedback);
  const missingPhonemes = phonemeKeys.filter(key => data.feedback[key].error_type === 'missing');
  const extraPhonemes = phonemeKeys.filter(key => data.feedback[key].error_type === 'extra');

  const renderPhonemeButtons = (phonemeList) => {
    if (phonemeList.length === 0) {
      return <Text style={styles.noErrorText}>無明顯錯誤</Text>;
    }
    return phonemeList.map((phoneme, index) => (
      <TouchableOpacity
        key={`${phoneme}-${index}`}
        style={[styles.phonemeButton, selectedPhoneme === phoneme && styles.selectedPhonemeButton]}
        onPress={() => setSelectedPhoneme(phoneme)}
      >
        <Text style={styles.phonemeButtonText}>{index + 1}</Text>
      </TouchableOpacity>
    ));
  };

  const getVideoSource = () => {
    if (!selectedPhoneme) {
      console.warn("No phoneme selected");
      return null;
    }
    
    const phoneme = data.feedback[selectedPhoneme]?.phoneme;
    if (!phoneme) {
      console.warn(`No phoneme data found for selected phoneme: ${selectedPhoneme}`);
      return null;
    }
  
    const phonemeNumber = Object.keys(phoneme_map).find(key => phoneme_map[key] === phoneme);
    
    if (!phonemeNumber) {
      console.warn(`No video found for phoneme: ${phoneme}`);
      return null;
    }
    
    const videoFile = videoSources[phonemeNumber];
    if (!videoFile) {
      console.warn(`No video file found for phoneme number: ${phonemeNumber}`);
      return null;
    }
  
    console.log("Video source URI:", videoFile.uri);
    return videoFile.uri;
  };

  const handleVideoOption = async () => {
    const source = getVideoSource();
    if (source) {
      console.log("Navigating to FullScreenVideo with source:", source);
      setVideoData(source);
      setShowVideo(true)
    } else {
      console.warn("Video source not found");
      // 可以在這裡添加一個警告給用戶
      Alert.alert("錯誤", "無法找到視頻源");
    }
  };
  
  
  
  const renderWeakPhonemeButtons = () => {
    if (data.weak_phonemes.length === 0) {
      return <Text style={styles.noErrorText}>無明顯錯誤</Text>;
    }
    return data.weak_phonemes.map((phonemes, index) => (
      <TouchableOpacity
        key={`${phonemes}-${index}`}
        style={[styles.phonemeButton, selectedWeakPhoneme === phonemes && styles.selectedPhonemeButton]}
        onPress={() => setSelectedWeakPhoneme(phonemes)}
      >
        <Text style={styles.phonemeButtonText}>{phonemes}</Text>
      </TouchableOpacity>
    ));
  };
  
  const renderFeedback = () => {
    if (!selectedPhoneme) return null;
    const feedback = data.feedback[selectedPhoneme];
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>錯誤音素: {feedback.phoneme}</Text>
        <Text style={styles.feedbackText}>口腔位置: {feedback.correction.mouth_position}</Text>
        <Text style={styles.feedbackText}>常見錯誤: {feedback.common_mistake}</Text>
        <Text style={styles.feedbackText}>舌位: {feedback.correction.tongue_position}</Text>
        <Text style={styles.feedbackText}>發音: {feedback.correction.pronunciation}</Text>
        <View style={styles.videoOptionsContainer}>
          <TouchableOpacity style={styles.videoOptionButton} onPress={() => handleVideoOption('animation')}>
            <Text style={styles.videoOptionButtonText}>觀看動畫</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoOptionButton} onPress={() => handleVideoOption('real')}>
            <Text style={styles.videoOptionButtonText}>觀看真人影片</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderWeakPhonemeInfo = () => {
    if (!selectedWeakPhoneme) return null;
    const info = data.phoneme_info[selectedWeakPhoneme];
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>音素資訊:</Text>
        <Text style={styles.feedbackText}>
          口腔位置: {info["口腔位置"]}{"\n"}
          常見錯誤: {info["常見錯誤"]}{"\n"}
          發音: {info["發音"]}{"\n"}
          舌位: {info["舌位"]}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={isWhite ? [COLORS.lightBg1, COLORS.lightBg2] : [COLORS.darkBg1, COLORS.darkBg2]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: isWhite ? COLORS.darkText : COLORS.lightText }]}>
            解析结果: {getMsgState()}
          </Text>
          <Text style={[styles.result, { color: isWhite ? COLORS.darkText : COLORS.lightText }]}>
            準確率: {accuracy}%
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.mainButton} onPress={() => setShowPhonemes(true)}>
              <Text style={styles.mainButtonText}>差異因素</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={() => setShowWeakPhonemes(true)}>
              <Text style={styles.mainButtonText}>較弱因素</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>關閉</Text>
          </TouchableOpacity>
        </View>
          

        <Modal visible={showPhonemes} animationType="fade" transparent={true}>
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>差異因素</Text>
              <View style={styles.errorTypeButtons}>
                <TouchableOpacity
                  style={[styles.errorTypeButton, errorType === 'missing' && styles.selectedErrorTypeButton]}
                  onPress={() => setErrorType('missing')}
                >
                  <Text style={styles.errorTypeButtonText}>少念</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.errorTypeButton, errorType === 'extra' && styles.selectedErrorTypeButton]}
                  onPress={() => setErrorType('extra')}
                >
                  <Text style={styles.errorTypeButtonText}>多念</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.scrollView}>
                <View style={styles.phonemeButtonContainer}>
                  {renderPhonemeButtons(errorType === 'missing' ? missingPhonemes : extraPhonemes)}
                </View>
              </ScrollView>
              <ScrollView style={styles.scrollView}>
                {renderFeedback()}
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => {
                setShowPhonemes(false);
                setSelectedPhoneme(null);
              }}>
                <Text style={styles.buttonText}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showWeakPhonemes} animationType="fade" transparent={true}>
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>較弱因素</Text>
              <ScrollView style={styles.scrollView}>
                <View style={styles.phonemeButtonContainer}>
                  {renderWeakPhonemeButtons()}
                </View>
              </ScrollView>
              <ScrollView style={styles.scrollView}>
                {renderWeakPhonemeInfo()}
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => {
                setShowWeakPhonemes(false);
                setSelectedWeakPhoneme(null);
              }}>
                <Text style={styles.buttonText}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showVideo}
          onRequestClose={() => {
            setShowVideo(false);
            setVideoData(null);
          }}
        >
          {videoData && (
            <FullScreenVideo 
              videoSource={videoData} 
              onClose={() => {
                setShowVideo(false);
                setVideoData(null);
              }} 
            />
          )}
        </Modal>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...FONTS.h2,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  result: {
    ...FONTS.body,
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    flex: 1,
    marginHorizontal: 10,
  },
  mainButtonText: {
    color: "white",
    ...FONTS.button,
    fontSize: 18,  // 調整字體大小
    textAlign: 'center',
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    ...FONTS.button,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.lightBg1,
    padding: 20,
    borderRadius: 10,
    width: width * 0.9,
    maxHeight: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...FONTS.h2,
    textAlign: 'center',
    marginBottom: 20,
  },
  phonemeButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  phonemeButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    margin: 5,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPhonemeButton: {
    backgroundColor: COLORS.secondary,
  },
  phonemeButtonText: {
    color: 'white',
    ...FONTS.button,
  },
  scrollView: {
    maxHeight: height * 0.3,  
    width: '100%',
  },
  feedbackContainer: {
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 5,
  },
  feedbackTitle: {
    ...FONTS.h3,
    marginBottom: 10,
    textAlign: 'left',
  },
  feedbackText: {
    ...FONTS.body,
    textAlign: 'left',
  },
  errorTypeButtons: {
    flexDirection: 'row',  
    justifyContent: 'space-between', 
    width: '100%',  
    marginBottom: 20,
    paddingHorizontal: 10, 
  },
  errorTypeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    flex: 1,
    marginHorizontal: 10,  
    alignItems: 'center',
  },
  errorTypeButtonText: {
    color: 'white', 
    ...FONTS.button, 
    fontSize: 16, 
    textAlign: 'center', 
  },
  noErrorText: {
    color: COLORS.secondaryText, // 或者其他合適的顏色
    ...FONTS.body,
    textAlign: 'center',
    marginVertical: 20, // 控制提示文字的位置
  },
  videoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  videoOptionButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  videoOptionButtonText: {
    color: 'white',
    textAlign: 'center',
    ...FONTS.button,
  },
  videoModalContent: {
    backgroundColor: COLORS.lightBg1,
    padding: 20,
    borderRadius: 10,
    width: width * 0.9,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '80%',
  },
});
