import React from 'react';
import {View, ScrollView, TouchableOpacity, Linking} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {moderateScale as ms} from 'react-native-size-matters';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';
import PanelShell from './PanelShell';
import CallIcon from '../../../assets/svg_icon/call_Icon_black.svg';

// Trip contacts, grouped by stop. `kind` picks the badge colour (pickup =
// green, drop = red); the ungrouped `dispatcher` entry always sits on top.
const DISPATCHER = {id: 'dispatcher', name: 'Alex R', role: 'Dispatcher', phone: '(408) 555-0100'};

const STOP_GROUPS: CallGroup[] = [
  {
    id: 'p1',
    badge: 'P1',
    kind: 'pickup',
    label: 'Pickup - San Jose CA',
    contacts: [
      {id: 'p1-shipper', name: 'Raj Mehta', role: 'Shipper', phone: '(408) 555-0132'},
      {id: 'p1-dock', name: 'Raj Mehta', role: 'Dock Security', phone: '(408) 555-0144'},
    ],
  },
  {
    id: 'p2',
    badge: 'P2',
    kind: 'pickup',
    label: 'Pickup - San Jose CA',
    contacts: [
      {id: 'p2-shipper', name: 'Raj Mehta', role: 'Shipper', phone: '(408) 555-0155'},
    ],
  },
  {
    id: 'd1',
    badge: 'D1',
    kind: 'drop',
    label: 'Delivery - Newark NJ',
    contacts: [
      {id: 'd1-receiver', name: 'Priya Nair', role: 'Receiving', phone: '(320) 555-0932'},
    ],
  },
];

/** Headset glyph for the dispatcher row — no matching asset in svg_icon. */
function HeadsetIcon({size, color}: {size: number; color: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M2 15a2 2 0 0 1 2-2h1v6H4a2 2 0 0 1-2-2v-2ZM19 13h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v-6Z"
        fill={color}
      />
      <Path
        d="M20 19v.5a2.5 2.5 0 0 1-2.5 2.5H13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CallButton({
  phone,
  onCall,
}: {
  phone: string;
  onCall: (phone: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.callRowBtn}
      onPress={() => onCall(phone)}
      activeOpacity={0.85}>
      <CallIcon width={ms(15)} height={ms(15)} color={colors.white} />
    </TouchableOpacity>
  );
}

function ContactRow({
  contact,
  onCall,
  icon,
}: {
  contact: CallContact;
  onCall: (phone: string) => void;
  /** Leading glyph; the dispatcher row supplies a headset. */
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.callRow}>
      <View style={styles.callRowIcon}>{icon}</View>
      <AppText style={styles.callRowName} numberOfLines={1}>
        {contact.name}
      </AppText>
      <AppText style={styles.callRowRole}>{contact.role}</AppText>
      <CallButton phone={contact.phone} onCall={onCall} />
    </View>
  );
}

/**
 * "Call" card opened from the phone button in the side toolbar. Lists the
 * dispatcher plus every contact on the trip, grouped by stop.
 */
/** One person the driver can call. */
export interface CallContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

/** A stop, with the contacts attached to it. */
export interface CallGroup {
  id: string;
  badge: string;
  kind: string;
  label: string;
  contacts: CallContact[];
}

export interface CallPanelProps {
  onClose?: () => void;
  dispatcher?: CallContact;
  groups?: CallGroup[];
  onCall?: (phone: string) => void;
}

export default function CallPanel({
  onClose,
  dispatcher = DISPATCHER,
  groups = STOP_GROUPS,
  onCall,
}: CallPanelProps) {
  const handleCall = (phone: string) => {
    if (onCall) {
      onCall(phone);
      return;
    }
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});
    }
  };

  return (
    <PanelShell
      title="Call"
      subtitle="Choose who to call for this trip"
      onClose={onClose}
      wrapStyle={styles.callPanelWrap}>
      <ScrollView
        style={styles.callBody}
        contentContainerStyle={styles.callBodyContent}
        showsVerticalScrollIndicator={false}>
        {!!dispatcher && (
          <ContactRow
            contact={dispatcher}
            onCall={handleCall}
            icon={<HeadsetIcon size={ms(18)} color={colors.text_dark} />}
          />
        )}

        {groups.map(group => (
          <View key={group.id}>
            <View style={styles.callGroupHeader}>
              <View
                style={[
                  styles.callGroupBadge,
                  group.kind === 'drop' && styles.callGroupBadgeDrop,
                ]}>
                <AppText style={styles.callGroupBadgeText}>{group.badge}</AppText>
              </View>
              <AppText style={styles.callGroupLabel} numberOfLines={1}>
                {group.label}
              </AppText>
            </View>

            {group.contacts.map(contact => (
              <ContactRow key={contact.id} contact={contact} onCall={handleCall} />
            ))}
          </View>
        ))}
      </ScrollView>
    </PanelShell>
  );
}
