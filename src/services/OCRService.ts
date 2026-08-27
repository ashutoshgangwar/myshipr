import TextRecognition from '@react-native-ml-kit/text-recognition';
import { openCamera, openGallery } from './MediaService';


export const scanWithCamera = async () => {
  try {
    const image = await openCamera();
    if (!image?.uri) return null;

    const result = await TextRecognition.recognize(image.uri);
    console.log('text conpresed form OCEService--', result.text)
    return { image, text: result.text };
  } catch (err) {
    console.error('OCR Error:', err);
    return null;
  }
};

export const scanWithGallery = async () => {
  try {
    const image = await openGallery();
    if (!image?.uri) return null;

    const result = await TextRecognition.recognize(image.uri);
    return { image, text: result.text };
  } catch (err) {
    console.error('OCR Error:', err);
    return null;
  }
};
