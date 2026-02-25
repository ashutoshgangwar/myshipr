import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import AppText from '../../theme/AppText';

const VoiceButton = ({ onPress, listening }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={listening}
      style={{
        padding: 12,
        borderRadius: 50,
        backgroundColor: listening ? '#ff4d4d' : '#4CAF50',
        alignItems: 'center',
        marginLeft: 8,
        opacity: listening ? 0.6 : 1,
      }}
    >
      <AppText style={{ color: '#fff', fontSize: 18 }}>
        {listening ? 'Listening...' : '🎤'}
      </AppText>
    </TouchableOpacity>
  );
};

export default VoiceButton;
