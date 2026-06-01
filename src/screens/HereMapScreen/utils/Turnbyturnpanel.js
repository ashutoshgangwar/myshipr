// TurnByTurnPanel.jsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const LOOKAHEAD_METERS = 80;

const ACTION_ICON = {
  depart:         '🚀',
  arrive:         '🏁',
  turn:           null,
  keep:           null,
  ramp:           '↗',
  roundaboutExit: '🔄',
  continue:       '↑',
  merge:          '⤵',
  ferry:          '⛴',
};
const DIR_ICON = {
  left:           '←',
  right:          '→',
  'slight-left':  '↖',
  'slight-right': '↗',
  'sharp-left':   '↙',
  'sharp-right':  '↘',
  straight:       '↑',
  uturn:          '↩',
};
const ACTION_COLOR = {
  depart:         '#22C55E',
  arrive:         '#F59E0B',
  roundaboutExit: '#8B5CF6',
  turn:           '#3B82F6',
  ramp:           '#06B6D4',
  keep:           '#64748B',
  continue:       '#64748B',
  default:        '#94A3B8',
};

function resolveIcon(step) {
  if (!step) return '↑';
  const base = ACTION_ICON[step.action];
  if (base !== undefined && base !== null) return base;
  if (step.direction) return DIR_ICON[step.direction] ?? '↑';
  return '↑';
}
function resolveColor(action) {
  return ACTION_COLOR[action] ?? ACTION_COLOR.default;
}
function formatDist(m) {
  if (!Number.isFinite(m) || m < 0) return '';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}
function formatDur(s) {
  if (!Number.isFinite(s) || s <= 0) return '';
  const m = Math.floor(s / 60);
  if (m < 1)  return '<1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

// ─── computeIndices ────────────────────────────────────────────────────────
// Returns:
//   activeActionIdx  – action user is currently ON (executing right now)
//   nextActionIdx    – the UPCOMING maneuver (activeActionIdx + 1)
//   isApproaching    – metersToNext ≤ 80 AND there IS a next step → show orange pill
//
// FIX: isApproaching must only fire when nextActionIdx > activeActionIdx
//      (i.e. there actually IS a distinct next step to preview).
//      When activeActionIdx === nextActionIdx (clamped at last step) never approach.
function computeIndices(actions, snapSegmentIndex, metersToNext) {
  if (!actions.length) {
    return {activeActionIdx: 0, nextActionIdx: 0, isApproaching: false};
  }
  // Treat -1 (not snapped yet) as segment 0
  const seg = snapSegmentIndex >= 0 ? snapSegmentIndex : 0;

  // activeActionIdx = last action whose offset <= current segment
  let activeActionIdx = 0;
  for (let i = actions.length - 1; i >= 0; i--) {
    if ((actions[i].offset ?? 0) <= seg) {
      activeActionIdx = i;
      break;
    }
  }

  // nextActionIdx = the step AFTER active (clamped to last)
  const nextActionIdx = Math.min(activeActionIdx + 1, actions.length - 1);

  // isApproaching: only true when:
  //   1. metersToNext is a valid positive number
  //   2. within the lookahead window
  //   3. there IS a distinct next step (nextActionIdx !== activeActionIdx)
  const hasDistinctNext = nextActionIdx !== activeActionIdx;
  const isApproaching =
    hasDistinctNext &&
    Number.isFinite(metersToNext) &&
    metersToNext >= 0 &&
    metersToNext <= LOOKAHEAD_METERS;

  return {activeActionIdx, nextActionIdx, isApproaching};
}

// ─── StepRow ──────────────────────────────────────────────────────────────
const StepRow = React.memo(({item, index, isActive, isNext, isLast, onPress}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.02 : 1)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.02 : 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [isActive, scaleAnim]);

  const icon  = resolveIcon(item);
  const color = resolveColor(item.action);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onPress?.(index)}>
      <Animated.View
        style={[
          s.stepRow,
          isActive ? s.stepRowActiveBg : isNext ? s.stepRowNextBg : s.stepRowIdleBg,
          {transform: [{scale: scaleAnim}]},
          isActive && s.stepRowActiveBorder,
          isNext && !isActive && s.stepRowNextBorder,
        ]}>
        <View style={s.stepLeft}>
          <View style={[s.stepBubble, {backgroundColor: color + '22', borderColor: color}]}>
            <Text style={[s.stepBubbleText, {color}]}>{icon}</Text>
          </View>
          {!isLast && <View style={[s.connector, {backgroundColor: color + '40'}]} />}
        </View>
        <View style={s.stepBody}>
          {isNext && !isActive && (
            <View style={s.nextBadge}>
              <Text style={s.nextBadgeText}>NEXT</Text>
            </View>
          )}
          <Text
            style={[
              s.stepInstruction,
              isActive && s.stepInstructionActive,
              isNext && !isActive && s.stepInstructionNext,
            ]}
            numberOfLines={3}>
            {item.instruction}
          </Text>
          <View style={s.stepMeta}>
            {!!item.length   && <Text style={s.stepMetaText}>{formatDist(item.length)}</Text>}
            {!!item.length && !!item.duration && <Text style={s.stepMetaDot}>·</Text>}
            {!!item.duration && <Text style={s.stepMetaText}>{formatDur(item.duration)}</Text>}
            {item.exit != null && (
              <View style={s.exitBadge}>
                <Text style={s.exitBadgeText}>Exit {item.exit}</Text>
              </View>
            )}
          </View>
        </View>
        {isActive && <View style={[s.activeDot, {backgroundColor: color}]} />}
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── NextStepBanner ────────────────────────────────────────────────────────
//
// DISPLAY LOGIC (FIXED):
//
//  NORMAL MODE (isApproaching = false):
//    • Shows CURRENT step (activeActionIdx) — the maneuver you are executing NOW
//    • Icon  = currentStep's icon
//    • Label = "NEXT TURN" (grey)
//    • Distance below = "in X m" (live metersToNext = distance to the NEXT maneuver)
//    • Counter = activeIdx + 1 / totalSteps
//
//  APPROACHING MODE (isApproaching = true, metersToNext ≤ 80m):
//    • Switches to show NEXT step (nextActionIdx) — the imminent maneuver
//    • Icon  = nextStep's icon  ← FIX: was always showing nextStep icon even in normal mode
//    • Label = orange pulsing pill "IN 72 m"
//    • Counter = nextIdx + 1 / totalSteps
//
// KEY FIXES vs original:
//   1. `step` = currentStep normally, nextStep only when approaching
//   2. Counter uses activeIdx normally, nextIdx when approaching
//   3. Distance label hidden in approaching mode (pill already shows it)
const NextStepBanner = ({
  nextStep,
  currentStep,
  totalSteps,
  activeIdx,      // index of step user is currently ON
  nextIdx,        // index of the upcoming maneuver
  metersToNext,   // live metres from current position to the NEXT maneuver point
  isApproaching,  // true when metersToNext ≤ 80 AND nextIdx > activeIdx
  onExpand,
}) => {
  // FIX #1: Show currentStep normally. Only preview nextStep when truly approaching.
  const step = isApproaching ? (nextStep ?? currentStep) : (currentStep ?? nextStep);
  if (!step) return null;

  const icon  = resolveIcon(step);
  const color = resolveColor(step.action);

  // FIX #2: Counter reflects which step we are showing
  const displayIdx = isApproaching ? nextIdx : activeIdx;

  // Pulse animation for orange approach pill
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef(null);
  useEffect(() => {
    if (isApproaching) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.12, duration: 350, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1.0,  duration: 350, useNativeDriver: true}),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [isApproaching, pulseAnim]);

  // Distance to show:
  //   Normal mode    → show live metersToNext as "in X m" below instruction
  //   Approach mode  → show inside the orange pill, not below (avoid duplication)
  const liveDist = Number.isFinite(metersToNext) && metersToNext > 0
    ? metersToNext
    : null;
  const fallbackDist = Number.isFinite(step.length) && step.length > 0
    ? step.length
    : null;
  // In approaching mode: use live distance for the pill
  // In normal mode: use live distance (metersToNext = dist to NEXT maneuver)
  const distMeters = liveDist ?? fallbackDist;
  const distLabel  = distMeters != null ? formatDist(distMeters) : null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onExpand} style={s.banner}>

      {/* Direction/action icon — reflects the step currently being shown */}
      <View style={[s.bannerIconWrap, {backgroundColor: color + '22', borderColor: color}]}>
        <Text style={[s.bannerIcon, {color}]}>{icon}</Text>
      </View>

      <View style={s.bannerBody}>
        <View style={s.bannerLabelRow}>
          {isApproaching && distLabel ? (
            // APPROACH MODE: orange pulsing countdown pill "IN 72 m"
            <Animated.View style={[s.approachPill, {transform: [{scale: pulseAnim}]}]}>
              <Text style={s.approachPillText}>IN {distLabel}</Text>
            </Animated.View>
          ) : (
            // NORMAL MODE: plain grey "NEXT TURN" label
            <Text style={s.bannerLabel}>NEXT TURN</Text>
          )}
        </View>

        {/* Instruction for the step currently being displayed */}
        <Text style={s.bannerInstruction} numberOfLines={2}>
          {step.instruction}
        </Text>

        {/* NORMAL MODE only: live distance to the next maneuver below instruction */}
        {!isApproaching && distLabel != null && (
          <Text style={s.bannerDist}>in {distLabel}</Text>
        )}
      </View>

      <View style={s.bannerRight}>
        {/* FIX #3: Counter shows active step normally, next step when approaching */}
        <Text style={s.bannerCounter}>{displayIdx + 1}/{totalSteps}</Text>
        <Text style={s.bannerExpand}>⌃ list</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── TurnByTurnPanel ──────────────────────────────────────────────────────
export default function TurnByTurnPanel({
  routeResponse,
  isNavigating     = false,
  snapSegmentIndex = -1,
  metersToNext     = null,
  style,
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [manualIndex, setManualIndex] = useState(null);
  const listRef   = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const steps = useMemo(() => {
    try { return routeResponse?.routes?.[0]?.sections?.[0]?.actions ?? []; }
    catch (_) { return []; }
  }, [routeResponse]);

  const summary = useMemo(() => {
    try { return routeResponse?.routes?.[0]?.sections?.[0]?.summary ?? null; }
    catch (_) { return null; }
  }, [routeResponse]);

  // On every new route (start / reroute): collapse banner, clear manual selection
  useEffect(() => {
    setManualIndex(null);
    setExpanded(false);
  }, [routeResponse]);

  const {activeActionIdx, nextActionIdx, isApproaching} = useMemo(
    () => computeIndices(steps, snapSegmentIndex, metersToNext ?? Infinity),
    [steps, snapSegmentIndex, metersToNext],
  );

  const displayIndex = manualIndex ?? activeActionIdx;
  const currentStep  = steps[activeActionIdx] ?? null;
  const nextStep     = steps[nextActionIdx]   ?? null;

  // Auto-scroll list to active step when panel is open
  useEffect(() => {
    if (!expanded || !listRef.current || steps.length === 0) return;
    const safe = Math.min(Math.max(displayIndex, 0), steps.length - 1);
    try { listRef.current.scrollToIndex({index: safe, animated: true, viewOffset: 8}); }
    catch (_) {}
  }, [displayIndex, expanded]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 14,
    }).start();
  }, [expanded, slideAnim]);

  const panelHeight = slideAnim.interpolate({inputRange: [0, 1], outputRange: [0, 440]});
  const handleStepPress = useCallback(idx => setManualIndex(idx), []);

  if (!steps.length) return null;

  return (
    <View style={[s.root, style]} pointerEvents="box-none">

      {/* Banner — always visible while navigating with list closed */}
      {isNavigating && !expanded && (
        <NextStepBanner
          currentStep={currentStep}
          nextStep={nextStep}
          totalSteps={steps.length}
          activeIdx={activeActionIdx}   // FIX: pass activeIdx for normal-mode counter
          nextIdx={nextActionIdx}
          metersToNext={metersToNext}
          isApproaching={isApproaching}
          onExpand={() => setExpanded(true)}
        />
      )}

      {/* Full step list — shown when not navigating OR when expanded */}
      {(!isNavigating || expanded) && (
        <Animated.View style={[s.panel, isNavigating && {maxHeight: panelHeight}]}>
          <View style={s.panelHeader}>
            <View style={s.panelHandleWrap}>
              <View style={s.panelHandle} />
            </View>
            <View style={s.panelHeaderContent}>
              <Text style={s.panelTitle}>Turn-by-Turn</Text>
              <View style={s.panelMeta}>
                {!!summary?.length   && <Text style={s.panelMetaText}>{formatDist(summary.length)}</Text>}
                {!!summary?.length && !!summary?.duration && <Text style={s.panelMetaDot}>·</Text>}
                {!!summary?.duration && <Text style={s.panelMetaText}>{formatDur(summary.duration)}</Text>}
                <Text style={s.stepCount}>{steps.length} steps</Text>
              </View>
            </View>
            {isNavigating && (
              <TouchableOpacity style={s.collapseBtn} onPress={() => setExpanded(false)}>
                <Text style={s.collapseBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            ref={listRef}
            data={steps}
            keyExtractor={(_, i) => String(i)}
            renderItem={({item, index}) => (
              <StepRow
                item={item}
                index={index}
                isActive={index === displayIndex}
                isNext={index === nextActionIdx && index !== displayIndex}
                isLast={index === steps.length - 1}
                onPress={handleStepPress}
              />
            )}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={() => {}}
            keyboardShouldPersistTaps="handled"
            style={s.list}
          />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 200,
    paddingHorizontal: 12,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
  },
  bannerIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon:     {fontSize: 26},
  bannerBody:     {flex: 1},
  bannerLabelRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 3},
  bannerLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  approachPill: {
    backgroundColor: '#F59E0B22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  approachPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bannerInstruction: {color: '#F1F5F9', fontSize: 14, fontWeight: '700', lineHeight: 20},
  bannerDist:        {color: '#94A3B8', fontSize: 12, marginTop: 2},
  bannerRight:       {alignItems: 'flex-end', gap: 4},
  bannerCounter:     {color: '#475569', fontSize: 11, fontWeight: '600'},
  bannerExpand:      {color: '#3B82F6', fontSize: 10, fontWeight: '700'},

  // Panel
  panel: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 14,
  },
  panelHandleWrap: {alignItems: 'center', paddingTop: 8},
  panelHandle:     {width: 36, height: 4, borderRadius: 2, backgroundColor: '#334155'},
  panelHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelHeaderContent: {flex: 1},
  panelTitle:         {color: '#F1F5F9', fontSize: 15, fontWeight: '700', letterSpacing: 0.3},
  panelMeta:          {flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4},
  panelMetaText:      {color: '#64748B', fontSize: 11},
  panelMetaDot:       {color: '#334155', fontSize: 11},
  stepCount:          {color: '#3B82F6', fontSize: 11, fontWeight: '600', marginLeft: 6},
  collapseBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center', justifyContent: 'center',
  },
  collapseBtnText: {color: '#94A3B8', fontSize: 12},

  list:        {maxHeight: 380},
  listContent: {paddingTop: 6, paddingBottom: 12, paddingHorizontal: 10},

  // Step rows
  stepRow:             {flexDirection: 'row', borderRadius: 12, marginVertical: 2, padding: 10},
  stepRowIdleBg:       {backgroundColor: '#1E293B'},
  stepRowActiveBg:     {backgroundColor: '#0F2744'},
  stepRowNextBg:       {backgroundColor: '#161E30'},
  stepRowActiveBorder: {borderWidth: 1, borderColor: '#1E3A5F'},
  stepRowNextBorder:   {borderWidth: 1, borderColor: '#3B82F650'},
  stepLeft:            {width: 36, alignItems: 'center', marginRight: 10},
  stepBubble: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  stepBubbleText:        {fontSize: 14, lineHeight: 18},
  connector:             {width: 2, flex: 1, minHeight: 8, marginTop: 4, borderRadius: 1},
  stepBody:              {flex: 1, justifyContent: 'center'},
  stepInstruction:       {color: '#94A3B8', fontSize: 13, lineHeight: 18, fontWeight: '500'},
  stepInstructionActive: {color: '#F1F5F9', fontWeight: '600'},
  stepInstructionNext:   {color: '#CBD5E1', fontWeight: '500'},
  stepMeta:    {flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4, flexWrap: 'wrap'},
  stepMetaText:{color: '#475569', fontSize: 11},
  stepMetaDot: {color: '#334155', fontSize: 11},
  exitBadge: {
    backgroundColor: '#312E81', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4,
  },
  exitBadgeText: {color: '#A5B4FC', fontSize: 10, fontWeight: '600'},
  activeDot:     {width: 8, height: 8, borderRadius: 4, alignSelf: 'center', marginLeft: 8},
  nextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F615',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 3,
  },
  nextBadgeText: {color: '#3B82F6', fontSize: 9, fontWeight: '800', letterSpacing: 0.8},
});