import React, {useState} from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';
import {ms} from '../../../theme/scale';
import ChevronDown from '../../../assets/svg_icon/Chevron_Down.svg';

const CHEVRON_SIZE = ms(18);
const CHEVRON_HIT_SLOP = {top: 10, bottom: 10, left: 10, right: 10};

export default function StepConfirmCard({
  visible = false,
  step = 3,
  totalSteps = 4,
  title = 'Shipment Procured at Pickup 2',
  onConfirm,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }
  
  const wrapStyle = [
    styles.stepCardWrap,
    {bottom: styles.stepCardWrap.bottom + insets.bottom},
  ];

  const stepLabel = `Step ${step} of ${totalSteps}`;
  const toggle = () => setCollapsed(c => !c);

  const chevron = (
    <ChevronDown
      width={CHEVRON_SIZE}
      height={CHEVRON_SIZE}
      color={colors.textMuted}
      style={collapsed ? styles.stepChevronUp : null}
    />
  );

  // Collapsed: a pill that hugs its own text, keeping the card's right edge.
  if (collapsed) {
    return (
      <View style={wrapStyle} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.stepPill}
          onPress={toggle}
          activeOpacity={0.85}>
          <View style={styles.stepPillTexts}>
            <AppText style={styles.stepPillTitle} numberOfLines={1}>
              {title}
            </AppText>
            <AppText style={styles.stepLabel}>{stepLabel}</AppText>
          </View>
          {chevron}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={wrapStyle} pointerEvents="box-none">
      <View style={styles.stepCard}>
        <View style={styles.stepCardHeader}>
          <AppText style={styles.stepLabel}>{stepLabel}</AppText>
          <TouchableOpacity
            onPress={toggle}
            hitSlop={CHEVRON_HIT_SLOP}
            activeOpacity={0.7}>
            {chevron}
          </TouchableOpacity>
        </View>

        <AppText style={styles.stepTitle}>{title}</AppText>

        <TouchableOpacity
          style={styles.stepConfirmBtn}
          onPress={onConfirm}
          activeOpacity={0.85}>
          <AppText style={styles.stepConfirmText}>Confirm Done</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
