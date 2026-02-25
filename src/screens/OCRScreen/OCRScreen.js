import React, { useState } from 'react';
import { View, Text, Button, Image, ScrollView } from 'react-native';
import { scanWithCamera, scanWithGallery } from '../../services/OCRService';
import AppText from '../../theme/AppText';

const OCRScreen = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');

  const handleCamera = async () => {
    const result = await scanWithCamera();
    console.log('text form OCRSCreen camera log--', result.text);
    
    if (result) {
      setImage(result.image);
      setText(result.text);
    }
  };

  const handleGallery = async () => {
    const result = await scanWithGallery();
     console.log('text form OCRSCreen galary log--', result.text);
    if (result) {
      setImage(result.image);
      setText(result.text);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View>
      <Button title="Open Camera" onPress={handleCamera} />
      <Button title="Open Gallery" onPress={handleGallery} />

      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ height: 200, marginVertical: 20 }}
          resizeMode="contain"
        />
      )}

      <AppText style={{ fontWeight: 'bold' }}>OCR Result:</AppText>
      <AppText>{text || 'No text detected'}</AppText>
      </View>
    </ScrollView>
  );
};

export default OCRScreen;
