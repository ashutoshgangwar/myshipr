import React, { useRef, useState } from 'react';
import { View, TextInput, Keyboard } from 'react-native';
import useVoiceInput from '../../hooks/useVoiceInput';

const ProfileForm = () => {
  const { start, listening } = useVoiceInput();

  // 🔹 Form state
  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
  });

  // 🔹 Which field is currently using voice
  const activeFieldRef = useRef(null);

  const startVoiceForField = (fieldKey) => {
    Keyboard.dismiss();

    if (listening) return;

    activeFieldRef.current = fieldKey;

    start((text) => {
      console.log(`🎤 Voice for ${fieldKey}:`, text);

      setForm(prev => ({
        ...prev,
        [fieldKey]: prev[fieldKey]
          ? `${prev[fieldKey].trim()} ${text.trim()}`
          : text.trim(),
      }));
    }, 'hi-IN');
  };

  return (
    <View style={{ padding: 16 }}>

      {/* NAME */}
      <TextInput
        placeholder="Name (type or long-press to speak)"
        value={form.name}
        onChangeText={(t) => setForm({ ...form, name: t })}
        onLongPress={() => startVoiceForField('name')}
        style={inputStyle(listening, activeFieldRef.current === 'name')}
      />

      {/* CITY */}
      <TextInput
        placeholder="City (type or long-press to speak)"
        value={form.city}
        onChangeText={(t) => setForm({ ...form, city: t })}
        onLongPress={() => startVoiceForField('city')}
        style={inputStyle(listening, activeFieldRef.current === 'city')}
      />

      {/* ADDRESS */}
      <TextInput
        placeholder="Address (type or long-press to speak)"
        value={form.address}
        onChangeText={(t) => setForm({ ...form, address: t })}
        onLongPress={() => startVoiceForField('address')}
        style={inputStyle(listening, activeFieldRef.current === 'address')}
        multiline
      />

    </View>
  );
};

// 🔹 Styling helper
const inputStyle = (listening, isActive) => ({
  borderWidth: 1,
  padding: 14,
  borderRadius: 8,
  marginBottom: 12,
  backgroundColor: listening && isActive ? '#ffecec' : '#fff',
  borderColor: listening && isActive ? '#ff4d4d' : '#ccc',
});

export default ProfileForm;
