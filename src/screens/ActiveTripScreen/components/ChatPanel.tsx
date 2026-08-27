import React, {useState, useRef, useMemo, useCallback, useEffect} from 'react';
import {View, ScrollView, TextInput, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale as ms, verticalScale as vs} from 'react-native-size-matters';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import useKeyboardShift from '../hooks/useKeyboardShift';
import usePanelExpand from '../hooks/usePanelExpand';
import Chat_send_Icon from '../../../assets/svg_icon/chat_send_Icon.svg'

/** "2:14 PM" — formatted by hand so it doesn't depend on Intl being built in. */
function clockLabel(date: Date): string {
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = date.getHours() >= 12 ? 'PM' : 'AM';
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

// Breathing room between the composer and the top of the keyboard.
const KEYBOARD_GAP = vs(20);

const DEFAULT_MESSAGES: ChatMessage[] = [
  {id: 1, from: 'in', time: '2:14 PM', text: "Hey Deeveja, you're on track.\nWeather looks clear on I-45 S."},
  {id: 2, from: 'out', time: '2:14 PM', text: "Hey Deeveja, you're on track.\nWeather looks clear on I-45 S."},
  {id: 3, from: 'in', time: '2:14 PM', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sit amet pellentesque arcu'},
  {id: 4, from: 'out', time: '2:14 PM', text: "Hey Deeveja, you're on track."},
];

/** One bubble in the thread. */
export interface ChatMessage {
  id: string | number;
  text: string;
  /** 'me' renders right-aligned; anything else is the other party. */
  from?: string;
  time?: string;
}

export interface ChatPanelProps {
  onClose?: () => void;
  messages?: ChatMessage[];
  onSend?: (text: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function ChatPanel({
  onClose,
  messages = DEFAULT_MESSAGES,
  onSend,
  onExpandedChange,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  // Messages typed in this session, appended after whatever the parent passes
  // so a sent bubble shows up straight away at the bottom of the thread.
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const thread = useMemo(() => [...messages, ...sent], [messages, sent]);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const panelRef = useRef<View | null>(null);

  const {keyboardShift, keyboardTop, onPanelLayout} = useKeyboardShift();
  const {expanded, shellProps} = usePanelExpand(
    [styles.chatPanelWrap, {transform: [{translateY: -keyboardShift}]}],
    onExpandedChange,
  );

  // Fires on mount and on every new bubble, so the newest message is always the
  // one in view.
  const stickToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({animated: true});
  }, []);

  // Stretched, the panel covers the screen, so lifting it would drag the header
  // off the top — pad the composer up from the panel's bottom edge instead.
  // Docked, the whole panel floats up via `keyboardShift` and this stays 0.
  const [composerLift, setComposerLift] = useState(0);

  // How far the keyboard overlaps the panel is the only reliable number here:
  // whether the window shrinks when the keyboard opens varies by device and
  // Android version, so a fixed rule is right on one and wrong on the next.
  // Measuring the panel's own bottom covers both — it lands on the keyboard's
  // top edge when the window resized (no pad needed) and on the screen bottom
  // when it didn't (pad by the full overlap). The panel is pinned to the wrap,
  // so the padding we add can't move what we're measuring.
  useEffect(() => {
    if (!expanded) {
      setComposerLift(0);
      return undefined;
    }
    if (!keyboardTop) {
      setComposerLift(insets.bottom);
      return undefined;
    }

    let cancelled = false;
    const measure = () =>
      panelRef.current?.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        const overlap = y + height - keyboardTop;
        setComposerLift((overlap > 0 ? overlap : 0) + KEYBOARD_GAP);
        stickToBottom();
      });

    // Once now, once after the window has had time to resize (Android applies
    // that after the keyboard event).
    measure();
    const timer = setTimeout(measure, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [expanded, keyboardTop, insets.bottom, stickToBottom]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setSent(prev => [
      ...prev,
      {id: `sent-${prev.length}-${text.length}`, from: 'out', time: clockLabel(new Date()), text},
    ]);
    onSend?.(text);
    setDraft('');
  };

  return (
    <PanelShell
      title="Dispatcher · Alex R."
      subtitle="Online"
      subtitleStyle={{color: colors.status}}
      titleStyle={expanded ? styles.chatTitleFullscreen : null}
      onClose={onClose}
      onLayout={onPanelLayout}
      panelRef={panelRef}
      {...shellProps}>
      <ScrollView
        ref={scrollRef}
        style={[
          styles.chatBody,
          expanded ? styles.chatBodyFullscreen : styles.chatBodyDocked,
        ]}
        contentContainerStyle={expanded ? styles.chatBodyContentFullscreen : null}
        onContentSizeChange={stickToBottom}
        onLayout={stickToBottom}
        keyboardShouldPersistTaps="handled">
        {thread.map(m => {
          const out = m.from === 'out';
          return (
            <React.Fragment key={m.id}>
              <View
                style={[
                  styles.bubble,
                  out ? styles.bubbleOut : styles.bubbleIn,
                  expanded && styles.bubbleFullscreen,
                  expanded && (out ? styles.bubbleOutFullscreen : styles.bubbleInFullscreen),
                ]}>
                <AppText
                  style={[
                    out ? styles.bubbleTextOut : styles.bubbleTextIn,
                    expanded && styles.bubbleTextFullscreen,
                  ]}>
                  {m.text}
                </AppText>
              </View>
              {/* Timestamps only fit once the panel is stretched. */}
              {expanded && !!m.time && (
                <AppText
                  style={[
                    styles.chatTime,
                    out ? styles.chatTimeOut : styles.chatTimeIn,
                  ]}>
                  {m.time}
                </AppText>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.chatInputRow,
          expanded && styles.chatInputRowFullscreen,
          expanded && {marginBottom: composerLift},
        ]}>
        <TextInput
          style={[styles.chatInput, expanded && styles.chatInputFullscreen]}
          placeholder="Reply to Alex R. Dispatcher"
          placeholderTextColor={colors.placeholder}
          value={draft}
          onChangeText={setDraft}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          // Keep the keyboard up after sending, the way a messenger does.
          submitBehavior="submit"
        />
        <TouchableOpacity
          style={[styles.sendBtn, expanded && styles.sendBtnFullscreen]}
          onPress={handleSend}
          activeOpacity={0.85}>
          <Chat_send_Icon
            width={expanded ? ms(18) : ms(14)}
            height={expanded ? ms(18) : ms(14)}
          />
        </TouchableOpacity>
      </View>
    </PanelShell>
  );
}
