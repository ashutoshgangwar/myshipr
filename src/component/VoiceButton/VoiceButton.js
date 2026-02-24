import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

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
      <Text style={{ color: '#fff', fontSize: 18 }}>
        {listening ? 'Listening...' : '🎤'}
      </Text>
    </TouchableOpacity>
  );
};

export default VoiceButton;
