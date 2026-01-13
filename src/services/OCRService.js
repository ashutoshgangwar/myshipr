import TextRecognition from '@react-native-ml-kit/text-recognition';
import { openCamera, openGallery } from './MediaService';

const LANG = 'eng+hin';

export const scanWithCamera = async () => {
  try {
    const image = await openCamera();
    if (!image) return null;

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
    if (!image) return null;

    const result = await TextRecognition.recognize(image.uri);
    return { image, text: result.text };
  } catch (err) {
    console.error('OCR Error:', err);
    return null;
  }
};
