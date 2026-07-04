import React, {useState} from 'react';
import {View, ScrollView, TextInput, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import useKeyboardShift from '../hooks/useKeyboardShift';

const DEFAULT_MESSAGES = [
  {id: 1, from: 'in', text: "Hey Deeveja, you're on track.\nWeather looks clear on I-45 S."},
  {id: 2, from: 'out', text: "Hey Deeveja, you're on track.\nWeather looks clear on I-45 S."},
  {id: 3, from: 'in', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sit amet pellentesque arcu'},
  {id: 4, from: 'out', text: "Hey Deeveja, you're on track."},
];

export default function ChatPanel({onClose, messages = DEFAULT_MESSAGES, onSend}) {
  const [draft, setDraft] = useState('');

  const {keyboardShift, onPanelLayout} = useKeyboardShift();

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    onSend?.(text);
    setDraft('');
  };

  return (
    <PanelShell
      title="Dispatcher · Alex R."
      subtitle="Online"
      subtitleStyle={{color: colors.status}}
      onClose={onClose}
      onLayout={onPanelLayout}
      wrapStyle={[
        styles.chatPanelWrap,
        {transform: [{translateY: -keyboardShift}]},
      ]}>
      <ScrollView style={styles.chatBody} keyboardShouldPersistTaps="handled">
        {messages.map(m => {
          const out = m.from === 'out';
          return (
            <View key={m.id} style={[styles.bubble, out ? styles.bubbleOut : styles.bubbleIn]}>
              <AppText style={out ? styles.bubbleTextOut : styles.bubbleTextIn}>{m.text}</AppText>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Reply to Alex R. Dispatcher"
          placeholderTextColor={colors.placeholder}
          value={draft}
          onChangeText={setDraft}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
          <AppText style={styles.sendGlyph}>➤</AppText>
        </TouchableOpacity>
      </View>
    </PanelShell>
  );
}
