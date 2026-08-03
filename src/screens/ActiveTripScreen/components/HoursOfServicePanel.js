import React, {useState, useMemo} from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import usePanelExpand from '../hooks/usePanelExpand';

const STEPS = [
  {id: 'procured', title: 'Shipment Procured', detail: 'Load TX-88181-Assigned'},
  {id: 'pretrip', title: 'Pre Trip Inspection', detail: 'DVIR Passed'},
  {id: 'transit', title: 'In- Transit', detail: 'Dallas- Houston'},
  {id: 'break', title: 'Break Taken', detail: '30 minute rest'},
  {id: 'arrived', title: 'Arrived at Delivery', detail: 'Dock 4B, Houston'},
  {id: 'dropped', title: 'Shipment Dropped', detail: 'Dock 4B, Houston'},
];

export default function HoursOfServicePanel({onClose, onExpandedChange}) {
  // Steps the driver has confirmed done (tap to toggle).
  const [done, setDone] = useState({});
  const {expanded, shellProps} = usePanelExpand(
    styles.chatPanelWrap,
    onExpandedChange,
  );

  const toggle = id => setDone(prev => ({...prev, [id]: !prev[id]}));

  const completed = useMemo(
    () => STEPS.filter(s => done[s.id]).length,
    [done],
  );
  const pct = Math.round((completed / STEPS.length) * 100);

  return (
    <PanelShell
      title="Hours of Service"
      subtitle="Tap each step to confirm it's done"
      onClose={onClose}
      {...shellProps}>
      <View style={[styles.hosBodyContent, expanded && styles.hosBodyFullscreen]}>
        {STEPS.map((step, i) => {
          const isDone = !!done[step.id];
          const isLast = i === STEPS.length - 1;
          return (
            <TouchableOpacity
              key={step.id}
              style={styles.hosStep}
              activeOpacity={0.7}
              onPress={() => toggle(step.id)}>
              <View style={styles.hosBulletCol}>
                <View
                  style={[styles.hosBullet, isDone && styles.hosBulletDone]}>
                  {isDone && <AppText style={styles.hosBulletCheck}>✓</AppText>}
                </View>
                {!isLast && <View style={styles.hosConnector} />}
              </View>
              <View style={styles.hosStepTexts}>
                <AppText
                  style={[styles.hosStepTitle, isDone && styles.hosStepTitleDone]}>
                  {step.title}
                </AppText>
                <AppText style={styles.hosStepDetail}>{step.detail}</AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hosFooter}>
        <View style={styles.hosFooterRow}>
          <AppText style={styles.hosFooterText}>
            {completed} of {STEPS.length} Completed
          </AppText>
          <AppText style={styles.hosFooterPct}>{pct}%</AppText>
        </View>
        <View style={styles.hosProgressTrack}>
          <View style={[styles.hosProgressFill, {width: `${pct}%`}]} />
        </View>
      </View>
    </PanelShell>
  );
}
