import React, {useCallback, useState} from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

import styles from './Profile.styles';
import {
  CONTACT_FIELDS,
  DETAIL_SECTIONS,
  FLEET_HIDDEN_SECTIONS,
  FLEET_ONBOARDING_NOTICE,
  GRID_COLUMNS,
  INSURANCE,
  ONBOARDING_NOTICE,
  ROLE_LABELS,
  ms,
} from './constants';
import StatusBar from '../../../component/StatusBar/StatusBar';
import DashboardHeader from '../../../component/DashboardHeader/DashboardHeader';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import {IS_TABLET} from '../../../theme/device';
import BackArrow from '../../../assets/svg_icon/Back_arrow_map.svg';
import Chevron from '../../../assets/svg_icon/Chevron_Down.svg';
import CameraIcon from '../../../assets/svg_icon/camera_icon.svg';
import LockIcon from '../../../assets/svg_icon/lock.svg';
import {openCamera} from '../../../services/MediaService';
import {EMPTY_FACE_LOCK, getFaceLock} from '../../../services/FaceLockService';
import {
  NOT_AVAILABLE,
  insuranceLabel,
  toProfileDetails,
  toProfileIdentity,
  useDriverBank,
  useDriverProfile,
} from '../../../services/driverProfile';
import useDriverRole from '../../../hooks/useDriverRole';
import type {RootStackScreenProps} from '../../../types/navigation';
import type {KeyboardTypeOptions} from 'react-native';
import type {ContactFieldKey} from './constants';

const APP_VERSION = `Version ${DeviceInfo.getVersion()}`;

const BACK_ICON = IS_TABLET ? 24 : 18;
const CHEVRON = IS_TABLET ? ms(20) : ms(18);

const Field = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  editable = false,
  columns = 1,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  /** How many fields share the row; drives the width percentage. */
  columns?: number;
}) => (
  <View style={[styles.field, {width: `${100 / columns}%` as const}]}>
    <AppText style={styles.fieldLabel} numberOfLines={1}>
      {label}
    </AppText>
    <TextInput
      style={[styles.input, editable && styles.inputEditable]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      editable={editable}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
    />
  </View>
);

// White card with the navy title strip the detail sections share.
const Section = ({
  title,
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

/**
 * Mounted twice: as a root-stack route, and as the fleet driver's Settings
 * tab — which passes `showBack={false}` because a tab has nothing beneath it.
 */
type ProfileProps = RootStackScreenProps<'Profile'> & {showBack?: boolean};

export default function Profile({
  navigation,
  showBack = true,
}: ProfileProps) {
  // What the driver has typed into the contact pair this visit. Kept apart
  // from the profile rather than seeded from it: a key that is absent falls
  // through to whatever the record carries, so a payload landing mid-edit
  // cannot overwrite what is under the cursor.
  const [edits, setEdits] = useState<Partial<Record<ContactFieldKey, string>>>(
    {},
  );
  const [faceLock, setFaceLock] = useState(EMPTY_FACE_LOCK);
  // A photo taken this visit, which stands in front of the one on the record.
  const [cameraUri, setCameraUri] = useState<string | null>(null);

  // A company (fleet) driver's payout and insurance are handled by the fleet
  // owner, so those sections are dropped and the notice points at them.
  const {isFleet} = useDriverRole();
  const notice = isFleet ? FLEET_ONBOARDING_NOTICE : ONBOARDING_NOTICE;
  const roleLabel = isFleet ? ROLE_LABELS.fleet : ROLE_LABELS.single;
  const sections = isFleet
    ? DETAIL_SECTIONS.filter(s => !FLEET_HIDDEN_SECTIONS.includes(s.key))
    : DETAIL_SECTIONS;

  // Two calls, both identified by the access token alone. The bank read is
  // parked for a company driver — their Bank details section is hidden, so
  // nothing on screen would show the answer.
  const {profile, refresh: refreshProfile} = useDriverProfile();
  const {bank, refresh: refreshBank} = useDriverBank(!isFleet);

  const identity = toProfileIdentity(profile);
  const details = toProfileDetails(profile, bank);
  const avatarUri = cameraUri ?? identity.avatarUri;
  const contact = {
    phone: edits.phone ?? String(profile?.phoneNumber ?? ''),
    email: edits.email ?? String(profile?.email ?? ''),
  };
  const insured = profile?.insuredUnderCompanyPolicy === true;

  // The row mirrors whatever the Face Lock screen last stored, so coming back
  // from a re-scan shows the new state without a reload.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getFaceLock().then(state => {
        if (!cancelled) setFaceLock(state);
      });
      // Both respect their TTL, so returning to the screen inside that window
      // redraws the record already in the cache without a call.
      refreshProfile();
      refreshBank();
      return () => {
        cancelled = true;
      };
    }, [refreshProfile, refreshBank]),
  );

  const setField = (key: ContactFieldKey, text: string) =>
    setEdits(prev => ({...prev, [key]: text}));

  // openCamera resolves to null when the shot is cancelled or the permission
  // is denied, so the current photo survives either way.
  const changeAvatar = async () => {
    const asset = await openCamera();
    if (asset?.uri) {
      setCameraUri(asset.uri);
    }
  };

  const goBack = () => navigation?.goBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <DashboardHeader
            title="Profile Settings"
            subtitle="Manage your login and contact details"
            headerStyle={styles.dashboardHeader}
            titleStyle={styles.headerTitle}
            subtitleStyle={styles.headerSubtitle}
            icon={
              // Hidden when Profile is a bottom tab (fleet drivers) — there is
              // nothing under it to go back to there.
              showBack ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  activeOpacity={0.8}
                  onPress={goBack}>
                  <BackArrow width={BACK_ICON} height={BACK_ICON} />
                </TouchableOpacity>
              ) : null
            }
          />

          <View style={styles.body}>
            {/* IDENTITY */}
            <View style={styles.identityCard}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{uri: avatarUri}} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar} />
                )}
                <TouchableOpacity
                  style={styles.avatarBadge}
                  activeOpacity={0.8}
                  onPress={changeAvatar}>
                  <CameraIcon width={ms(11)} height={ms(11)} />
                </TouchableOpacity>
              </View>

              <View style={styles.identityText}>
                <AppText style={styles.driverName} numberOfLines={1}>
                  {identity.name}
                </AppText>
                <AppText style={styles.driverRole}>{roleLabel}</AppText>
              </View>
            </View>

            {/* CONTACT — the only editable section */}
            <Section title="Contact and Security">
              <View style={styles.fieldRow}>
                {CONTACT_FIELDS.map(field => (
                  <Field
                    key={field.key}
                    label={field.label}
                    placeholder={NOT_AVAILABLE}
                    keyboardType={field.keyboardType}
                    value={contact[field.key]}
                    onChangeText={text => setField(field.key, text)}
                    editable
                    columns={2}
                  />
                ))}
              </View>

              {/* Enrolment lives on its own screen — it needs the password
                  re-check before the device's face prompt. */}
              <TouchableOpacity
                style={styles.faceLockRow}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('FaceLock')}>
                <View style={styles.faceLockText}>
                  <AppText style={styles.faceLockTitle}>Face Lock</AppText>
                  <AppText style={styles.faceLockSub}>
                    {faceLock.enabled ? 'Enabled · Tap to Change' : 'Not set up · Tap to Set Up'}
                  </AppText>
                </View>
                <View style={styles.chevron}>
                  <Chevron
                    width={CHEVRON}
                    height={CHEVRON}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            </Section>

            <View style={styles.notice}>
              <LockIcon
                width={ms(13)}
                height={ms(13)}
                color={colors.white}
              />
              <AppText style={styles.noticeText}>{notice}</AppText>
            </View>

            {/* ONBOARDING DETAILS — read-only, owned by the Carrier Portal */}
            {sections.map(section => (
              <Section key={section.key} title={section.title}>
                <View style={styles.fieldRow}>
                  {section.fields.map(field => (
                    <Field
                      key={field.key}
                      label={field.label}
                      placeholder={NOT_AVAILABLE}
                      value={details[field.key]}
                      columns={field.full ? 1 : GRID_COLUMNS}
                    />
                  ))}
                </View>
              </Section>
            ))}

            {!isFleet && (
              <Section title="Insurance Details">
                <View style={styles.insuranceRow}>
                  <View style={styles.insuranceText}>
                    <AppText style={styles.insuranceTitle}>
                      {INSURANCE.title}
                    </AppText>
                    <AppText style={styles.insuranceSub}>
                      {INSURANCE.subtitle}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.insurancePill,
                      !insured && styles.insurancePillOff,
                    ]}>
                    <AppText
                      style={[
                        styles.insurancePillText,
                        !insured && styles.insurancePillTextOff,
                      ]}>
                      {insuranceLabel(profile?.insuredUnderCompanyPolicy)}
                    </AppText>
                  </View>
                </View>
              </Section>
            )}

            {/* Build version — last line of the screen on both platforms. */}
            <View style={styles.versionWrap}>
              <AppText style={styles.versionText}>{APP_VERSION}</AppText>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
