import {useEffect, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {Keyboard, Platform} from 'react-native';
import {verticalScale as vs} from 'react-native-size-matters';

/**
 * Keeps an absolutely-positioned floating panel above the on-screen keyboard.
 *
 * Attach the returned `onPanelLayout` to the panel wrapper and apply
 * `translateY: -keyboardShift` to its transform. When the keyboard opens the
 * panel is lifted by exactly the amount it would otherwise be covered by, and
 * dropped back down when the keyboard hides. Works on both iOS and Android.
 *
 * `keyboardTop` is the keyboard's top edge in screen coordinates (0 while it's
 * hidden) — full-screen panels measure themselves against it and pad their
 * footer, since lifting them would drag their header off-screen.
 */
export default function useKeyboardShift() {
  // Distance of the panel bottom from the top of the screen (captured on layout).
  const [panelBottom, setPanelBottom] = useState(0);
  // Amount (px) to lift the panel by so its inputs stay above the keyboard.
  const [keyboardShift, setKeyboardShift] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState(0);

  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, e => {
      const top = e.endCoordinates?.screenY ?? 0;
      // Overlap between the panel bottom and the keyboard, plus a little gap.
      const overlap = panelBottom + vs(16) - top;
      setKeyboardShift(overlap > 0 ? overlap : 0);
      setKeyboardTop(top);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardShift(0);
      setKeyboardTop(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [panelBottom]);

  const onPanelLayout = (e: LayoutChangeEvent) => {
    const {y, height} = e.nativeEvent.layout;
    setPanelBottom(y + height);
  };

  return {keyboardShift, keyboardTop, onPanelLayout};
}
