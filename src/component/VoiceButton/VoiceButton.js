import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

const VoiceButton = ({ onPress, listening }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={listening} // 👈 disable button while listening
      style={{
        padding: 12,
        borderRadius: 50,
        backgroundColor: listening ? '#ff4d4d' : '#4CAF50', // red while listening
        alignItems: 'center',
        marginLeft: 8,
        opacity: listening ? 0.6 : 1, // visually show it's disabled
      }}
    >
      <Text style={{ color: '#fff', fontSize: 18 }}>
        {listening ? 'Listening...' : '🎤'}
      </Text>
    </TouchableOpacity>
  );
};

export default VoiceButton;
