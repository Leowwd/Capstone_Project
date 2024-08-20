// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
// import Svg, { Path, Polygon } from 'react-native-svg';

// const { width, height } = Dimensions.get('window');

// const Guide = ({ step, onNext, onClose }) => {
//   const [translateY] = useState(new Animated.Value(height));

//   useEffect(() => {
//     Animated.timing(translateY, {
//       toValue: height / 2,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   }, [step]);

//   const guides = [
//     { text: "點擊這裡選擇一個範例音頻", position: { top: 100, left: 20 }, target: "selectButton" },
//     { text: "這裡顯示所選範例的文本", position: { top: 200, left: 20 }, target: "textScrollView" },
//     { text: "點擊這裡播放或暫停音頻", position: { top: 400, left: 20 }, target: "playButton" },
//     { text: "點擊這裡開始或停止錄音", position: { top: 500, left: 20 }, target: "recordButton" },
//     { text: "點擊這裡查看您的錄音", position: { bottom: 100, left: 20 }, target: "manageButton" },
//   ];

//   const currentGuide = guides[step];

//   const renderArrow = (target) => {
//     let arrowPosition;
//     switch (target) {
//       case "selectButton":
//         arrowPosition = { x1: 25, y1: 110, x2: 45, y2: 110, x3: 35, y3: 130 };
//         break;
//       case "textScrollView":
//         arrowPosition = { x1: 25, y1: 210, x2: 45, y2: 210, x3: 35, y3: 230 };
//         break;
//       case "playButton":
//         arrowPosition = { x1: 25, y1: 410, x2: 45, y2: 410, x3: 35, y3: 430 };
//         break;
//       case "recordButton":
//         arrowPosition = { x1: 25, y1: 510, x2: 45, y2: 510, x3: 35, y3: 530 };
//         break;
//       case "manageButton":
//         arrowPosition = { x1: 25, y1: height - 90, x2: 45, y2: height - 90, x3: 35, y3: height - 70 };
//         break;
//       default:
//         break;
//     }

//     return (
//       <Svg height={height} width={width} style={styles.arrow}>
//         <Polygon
//           points={`${arrowPosition.x1},${arrowPosition.y1} ${arrowPosition.x2},${arrowPosition.y2} ${arrowPosition.x3},${arrowPosition.y3}`}
//           fill="white"
//         />
//       </Svg>
//     );
//   };

//   return (
//     <View style={styles.overlay}>
//       {renderArrow(currentGuide.target)}
//       <Animated.View style={[styles.guideBox, { transform: [{ translateY }] }]}>
//         <Text style={styles.guideText}>{currentGuide.text}</Text>
//         <TouchableOpacity onPress={step < guides.length - 1 ? onNext : onClose}>
//           <Text style={styles.nextButton}>{step < guides.length - 1 ? '下一步' : '完成'}</Text>
//         </TouchableOpacity>
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   guideBox: {
//     position: 'absolute',
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     width: width - 40,
//     left: 20,
//   },
//   guideText: {
//     fontSize: 16,
//     marginBottom: 10,
//     color: 'black',
//   },
//   nextButton: {
//     color: 'blue',
//     fontSize: 16,
//     textAlign: 'right',
//   },
//   arrow: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//   },
// });

// export default Guide;
