import React from 'react';
import {SafeAreaView} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import ReceiverSignaturePad, {
  SIGNATURE_STORAGE_KEY,
} from '../../component/ReceiverSignaturePad/ReceiverSignaturePad';

const screenStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
};

const SignatureCaptureScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ReceiverSignaturePad useModal={false} onClose={() => navigation.goBack()} closeLabel="Back" />
    </SafeAreaView>
  );
};

export default SignatureCaptureScreen;
export {SIGNATURE_STORAGE_KEY};