<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, StatusBar, Image, ScrollView} from 'react-native';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';



// function Blink({text}){
//   const [isShowingText, setIsShowingText] = useState(true);

//   useEffect(() => {
//     const toggle = setInterval(() => {
//       setIsShowingText(!isShowingText);
//     }, 1000);

//     return () => clearInterval(toggle);
//   }, [isShowingText]);

//   if (!isShowingText) {
//     return null;
//   }

//   return <Text>{text}</Text>;
// }

// function Introduce(props) {
//   const [isIntroduce, setIntroduce] = useState(true);

//   return ( 
//     <View>
//       <Text>
//             我叫{props.name}, 我是一個{isIntroduce ? "渣南" : ""}
//       </Text>
//       <Button
//         onPress={() => {
//           setisIdiot(false);
//         }}

//         disabled={!isIntroduce}
        
//         title={isIntroduce ? "這是個按鈕喔" : "懷疑喔"}
//       />
//     </View>
//   );
// }

// function ChangeImage(){
//   const imgurl = require("./assets/123.jpg")
//   const imgurl2 = require("./assets/test.jpg")

//   const [currentImg, setCurrentImg] = useState(imgurl);
  
//   const handleClick = () => setCurrentImg(currentImg === imgurl? imgurl2 : imgurl)

//   return(
//     <View>
//       <Image 
//         source={currentImg} style={{width: 200, height: 200}}
//         resizeMode="contain"
//       />
//       <Button onPress={handleClick} title="交換圖片"/>
//     </View>
//   )
// }


export default function App()  {

  const [audioData, setAudioData] = useState([]);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const [recording, setRecording] = useState(null);
  const [recordingData, setRecordingData] = useState([]);

  useEffect(() => {
    async function fetchAudioData() {
      try {
        const response = await axios.get(
          "https://datasets-server.huggingface.co/rows?dataset=bookbot%2Fljspeech_phonemes&config=default&split=train&offset=0&length=100");
          setAudioData(response.data.rows);
      } catch (error) {
        console.error('抓不到音訊資料', error);
      }
    }

    fetchAudioData();
  }, []);

  async function playAudio(audioUrl, _text) {
    try {
      // 停止和卸載之前的錄音對象
      if (currentSound !== null) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }
      
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: audioUrl });
      await soundObject.playAsync();
      setCurrentSound(soundObject);
    } catch (error) {
      console.error('播放失敗', error);
    }
  }

  function handleExamepleText(audioURL, text){
    setSelectedAudioUrl(audioURL);
    setCurrentText(text);
    playAudio(audioURL, text)
  }
  


  async function startRecording() {
    try {
      // 停止和卸載任何先前的錄音對象
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      
      // 授權使用錄音功能
      await Audio.requestPermissionsAsync();
      
      await Audio.setAudioModeAsync({
        // 可以用iOS執行錄音功能
        allowsRecordingIOS: true,
        // 再靜音模式下也可以聽到聲音
        playsInSilentModeIOS: true,
      }); 
  
      // 開始新的錄音
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(recording);
    } catch (err) {
      console.error('錄音失敗:', err);
    }
  }
  

  async function stopRecording() {
    try {
      
      setRecording(null);
      await recording.stopAndUnloadAsync();
  
      // 取得錄音檔案的資訊
      const info = await FileSystem.getInfoAsync(recording.getURI());
      const newUri = `${FileSystem.documentDirectory}recording${recordingData.length + 1}.wav`;

      // 移動並重新命名錄音檔案
      await FileSystem.moveAsync({
        from: info.uri,
        to: newUri,
      });
  
      // 更新錄音清單
      const newData = [...recordingData, { uri: newUri, sound: new Audio.Sound() }];
      setRecordingData(newData);
    } catch (error) {
      console.error('錄音存檔失敗');
    }
  }
  
  async function playRecording(index) {
    try {
      
      const sound = recordingData[index].sound;
      
      await sound.unloadAsync();
      
      await sound.loadAsync({ uri: recordingData[index].uri });
      

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });

      await sound.setVolumeAsync(1.0);

      await sound.playAsync();

     
    } catch (error) {
      console.error('播放錄音失敗',error);
    }
  }

  function recordingList(){
    return recordingData.map((_recordingItem, index) => (
      <View key={index}>
        <Text>錄音#{index + 1}</Text>
        <Button onPress={() => playRecording(index)} title="播放" />
        <Button onPress={() => handleSharing(index)} title='分享'/>
      </View>
    ));
  }
  
  async function handleSharing(index) {
    try {
      const uri = recordingData[index].uri;
      await Sharing.shareAsync(uri, {
        //Uniform Type Identifier(UTI)用於IOS或MacOS使用的文件識別符
        dialogTitle: 'save recording',
        UTI: 'com.microsoft.waveform-audio', 
      });
    } catch (error) {
      console.error('分享錄音失敗');
    }
  }
  
  function clearRecordingData(){
    setRecordingData([]);
  }
  
  return(
      <ScrollView contentContainerStyle={styles.ScrollViewContainer}>
        <View style={styles.container}>
          <Text style={{fontSize : 24}}>音無虛發</Text>
          <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedAudioUrl}
            style={{ height: 200, width: 400 }}
            onValueChange={(itemValue, itemIndex) => setSelectedAudioUrl(itemValue)}
          >
            {audioData.map((audio, index) => (
              <Picker.Item 
                key={index} 
                label={audio.row.id} 
                value={audio.row.audio[0].src} 
              />
            ))}
          </Picker>
        </View>
      
        <Button
          title="播放實例"
          onPress={() => {const selectedAudio = audioData.find(audio => audio.row.audio[0].src === selectedAudioUrl);
            if (selectedAudio) {
              handleExamepleText(selectedAudio.row.audio[0].src, selectedAudio.row.text);
            }
          }}
        />
        <Text>{currentText}</Text>
        <Button
          title={recording ? '停止錄音' : '開始錄音'}
          onPress={recording ? stopRecording : startRecording}
        />
        {recordingList()}
        
        <Button title={recordingData.length > 0 ? "清除錄音": ""} 
          onPress={clearRecordingData}/> 
        
        <StatusBar style="auto" />
        </View>
      </ScrollView>  
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ScrollViewContainer:{
    flexGrow: 1,
    justifyContent: 'center',
  }
=======
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StyleSheet } from 'react-native';
import HomeScreen from './test/HomeScreen';
import RecordingListScreen from './test/RecordingListScreen';
import StartScreen from './test/StartScreen';
import Setting from './test/Setting';
import { BackgroundColorProvider } from './test/manage_backgroundColor';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a73e8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="首頁" component={HomeScreen} />
      <Stack.Screen name="實作介面" component={StartScreen}/>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <BackgroundColorProvider>
      <NavigationContainer style={styles}>
        <Drawer.Navigator initialRouteName="主頁面" 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a73e8',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
          <Drawer.Screen name="主頁面" component={MainStack} options={{ headerShown: false }} />
          <Drawer.Screen name="最近錄音" component={RecordingListScreen} />
          <Drawer.Screen name="設定" component={Setting} />
        </Drawer.Navigator>
      </NavigationContainer>
    </BackgroundColorProvider>
  );
}
const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: '#1a73e8',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
>>>>>>> 857b88a35aa5ceea6a42940a354ddc829644121b
});
