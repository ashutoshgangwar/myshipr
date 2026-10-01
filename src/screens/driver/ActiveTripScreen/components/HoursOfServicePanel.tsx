import React, {useMemo} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import AppText from '../../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import Skeleton from '../../../../component/Skeleton/Skeleton';
import {
  bone,
  tripChecklistBones,
} from '../../../../component/Skeleton/Skeleton.layouts';
import {ms, vs} from '../../../../theme/scale';
import usePanelExpand from '../hooks/usePanelExpand';
import {toChecklist} from '../../../../services/tripProgress';
import type {PreTripStep, TripStep} from '../../../../services/tripProgress';

// Four steps is the shape of an ordinary run — an inspection, a pickup and a
// couple of drops — and as many as the docked panel shows before it scrolls.
const CHECKLIST_BONES = tripChecklistBones(4);

// The footer's tally and its progress bar, the two things the checklist's
// length decides.
const FOOTER_BONES = [
  bone(ms(96), vs(11)),
  bone('100%', vs(6), {marginTop: vs(9), borderRadius: ms(4)}),
];

export interface HoursOfServicePanelProps {
  steps?: TripStep[];
  preTrip?: PreTripStep | null;
  /** The trip call is still out, so there is no checklist to draw yet. */
  loading?: boolean;
  /** The load's reference, for a stop that came through without an address. */
  awb?: string | null;
  /** Fired for the active stop's row only. */
  onStepPress?: (step: TripStep) => void;
  onClose?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function HoursOfServicePanel({
  steps = [],
  preTrip = null,
  loading = false,
  awb = null,
  onStepPress,
  onClose,
  onExpandedChange,
}: HoursOfServicePanelProps) {
  const {expanded, shellProps} = usePanelExpand(
    styles.chatPanelWrap,
    onExpandedChange,
  );

  const rows = useMemo(
    () => toChecklist(steps, preTrip, awb),
    [awb, preTrip, steps],
  );

  const completed = rows.filter(row => row.done).length;
  const pct = rows.length ? Math.round((completed / rows.length) * 100) : 0;
  const hasActive = rows.some(row => row.active);

  // The panel opens the moment the trip does, which is before
  // `GET /drivers/shipments/{tripId}` has said what the stops are. Bones give
  // the driver the shape of the run rather than an empty scroller over a
  // footer reading "0 of 0 Completed".
  const pending = loading && rows.length === 0;

  return (
    <PanelShell
      title="Hours of Service"
      subtitle={
        // The old copy invited a tap on every step. Only one is actionable
        // now, so the subtitle says which — and says nothing is outstanding
        // once the trip has been worked through.
        steps.length === 0
          ? 'Loading the trip’s progress…'
          : hasActive
          ? 'Tap the current stop to verify it'
          : 'Every stop completed'
      }
      onClose={onClose}
      {...shellProps}>
      {/* A long trip runs past the docked panel's height, so the steps scroll
          inside it. The footer stays outside the scroller: the progress bar is
          the one thing that should be readable without scrolling to it. */}
      <ScrollView
        style={expanded ? styles.hosBodyFullscreen : styles.hosBodyDocked}
        contentContainerStyle={styles.hosBodyContent}
        showsVerticalScrollIndicator={false}>
        {pending && <Skeleton isLoading layout={CHECKLIST_BONES} />}
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;

          const body = (
            <>
              <View style={styles.hosBulletCol}>
                <View
                  style={[
                    styles.hosBullet,
                    row.done && styles.hosBulletDone,
                    row.active && styles.hosBulletActive,
                  ]}>
                  {row.done && <AppText style={styles.hosBulletCheck}>✓</AppText>}
                </View>
                {!isLast && <View style={styles.hosConnector} />}
              </View>
              <View style={styles.hosStepTexts}>
                <View style={styles.hosStepHead}>
                  <AppText
                    style={[
                      styles.hosStepTitle,
                      row.done && styles.hosStepTitleDone,
                      row.active && styles.hosStepTitleActive,
                    ]}>
                    {row.title}
                  </AppText>
                  {/* When the backend cleared it. Absent on everything it has
                      not cleared, so the column is only ever as full as the
                      ticks beside it. */}
                  {Boolean(row.time) && (
                    <AppText style={styles.hosStepTime}>{row.time}</AppText>
                  )}
                </View>
                <AppText style={styles.hosStepDetail} numberOfLines={2}>
                  {row.detail}
                </AppText>
              </View>
            </>
          );

          // Only the stop being driven to is tappable, and all its tap does is
          // open the OTP sheet. A stop already cleared has nothing left to
          // verify; one further down the trip cannot be verified before the
          // stops in front of it; and the inspection has no status to set from
          // here. None of them gets a touchable's press feedback, because none
          // of them can be ticked from here.
          const step = row.step;
          if (!row.active || !step) {
            return (
              <View key={row.key} style={styles.hosStep}>
                {body}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={row.key}
              style={styles.hosStep}
              activeOpacity={0.7}
              onPress={() => onStepPress?.(step)}>
              {body}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.hosFooter}>
        <Skeleton isLoading={pending} layout={FOOTER_BONES}>
          <View style={styles.hosFooterRow}>
            <AppText style={styles.hosFooterText}>
              {completed} of {rows.length} Completed
            </AppText>
            <AppText style={styles.hosFooterPct}>{pct}%</AppText>
          </View>
          <View style={styles.hosProgressTrack}>
            <View style={[styles.hosProgressFill, {width: `${pct}%`}]} />
          </View>
        </Skeleton>
      </View>
    </PanelShell>
  );
}
