import React, {useCallback, useState} from 'react';
import {ActivityIndicator, ScrollView, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import styles from './FaceLock.styles';
import {FACE_LOCK_COPY, ms} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import ErrorModal from '../../component/ErrorModal/ErrorModal';
import FaceScanModal from '../../component/FaceScanModal/FaceScanModal';
import PasswordPromptModal from '../../component/PasswordPromptModal/PasswordPromptModal';
import useErrorModal from '../../hooks/useErrorModal';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import Chevron from '../../assets/svg_icon/Chevron_Down.svg';
import {
  APP_PERMISSION_TYPES,
  requestAppPermission,
} from '../../services/PermissionService';
import {
  EMPTY_FACE_LOCK,
  enrollFace,
  formatScanDate,
  getFaceLock,
  verifyPassword,
} from '../../services/FaceLockService';

// Handing straight from one modal to the next mid-fade drops the camera
// preview on iOS, so the scan waits out the password sheet's dismissal.
const MODAL_DISMISS_MS = 350;
const waitForModalDismiss = () =>
  new Promise(resolve => setTimeout(resolve, MODAL_DISMISS_MS));

const BACK_ICON = IS_TABLET ? 24 : 18;
const CHEVRON = IS_TABLET ? ms(20) : ms(18);

export default function FaceLock({navigation}) {
  const [faceLock, setFaceLock] = useState(EMPTY_FACE_LOCK);
  const [loading, setLoading] = useState(true);
  const [askPassword, setAskPassword] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const {modalProps, showMessage} = useErrorModal();

  // Re-read on focus: the enrolment can also be cleared from the device's own
  // settings while the app sits in the background.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getFaceLock().then(state => {
        if (cancelled) return;
        setFaceLock(state);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const openPasswordPrompt = () => {
    setPasswordError(null);
    setAskPassword(true);
  };

  // Password first, then the camera — a stolen unlocked phone still can't
  // enrol a new face on this account.
  const confirmPassword = async password => {
    setChecking(true);
    const {success, error} = await verifyPassword(password);

    if (!success) {
      setChecking(false);
      setPasswordError(error);
      return;
    }

    setAskPassword(false);
    await waitForModalDismiss();

    const permission = await requestAppPermission(APP_PERMISSION_TYPES.CAMERA);
    setChecking(false);

    if (!permission.granted) {
      // A blocked permission has already offered Settings through the service's
      // own alert, so only the other refusals need a modal here.
      if (!permission.blocked) {
        showMessage({
          variant: 'error',
          title: FACE_LOCK_COPY.failureTitle,
          message: permission.unavailable
            ? FACE_LOCK_COPY.cameraMissing
            : FACE_LOCK_COPY.cameraDenied,
        });
      }
      return;
    }

    setScanning(true);
  };

  // The scan modal keeps the capture to itself — the enrolment only records
  // that a scan happened, so nothing about the image leaves that screen.
  const finishScan = async () => {
    setScanning(false);
    const state = await enrollFace();
    setFaceLock(state);

    // Same modal hand-off problem as above, in the other direction.
    await waitForModalDismiss();

    showMessage({
      variant: 'success',
      title: FACE_LOCK_COPY.successTitle,
      message: FACE_LOCK_COPY.successMessage,
      closeText: 'Done',
    });
  };

  const scannedOn = formatScanDate(faceLock.lastScannedAt);

  const cardTitle = faceLock.enabled
    ? FACE_LOCK_COPY.setUpTitle
    : FACE_LOCK_COPY.notSetUpTitle;

  const cardSub = !faceLock.enabled
    ? FACE_LOCK_COPY.notSetUpSub
    : scannedOn
    ? FACE_LOCK_COPY.scannedSub(scannedOn)
    : FACE_LOCK_COPY.scannedUnknownSub;

  const actionLabel = faceLock.enabled
    ? FACE_LOCK_COPY.rescanAction
    : FACE_LOCK_COPY.scanAction;

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
          showsVerticalScrollIndicator={false}>
          <DashboardHeader
            title={FACE_LOCK_COPY.headerTitle}
            subtitle={FACE_LOCK_COPY.headerSubtitle}
            headerStyle={styles.dashboardHeader}
            titleStyle={styles.headerTitle}
            subtitleStyle={styles.headerSubtitle}
            icon={
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.8}
                onPress={() => navigation?.goBack()}>
                <BackArrow width={BACK_ICON} height={BACK_ICON} />
              </TouchableOpacity>
            }
          />

          <View style={styles.body}>
            <View style={styles.card}>
              {loading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <>
                  <AppText style={styles.cardTitle}>{cardTitle}</AppText>
                  <AppText style={styles.cardSub}>{cardSub}</AppText>

                  <TouchableOpacity
                    style={styles.actionRow}
                    activeOpacity={0.85}
                    disabled={checking || scanning}
                    onPress={openPasswordPrompt}>
                    <AppText style={styles.actionText} numberOfLines={1}>
                      {actionLabel}
                    </AppText>
                    {checking || scanning ? (
                      <ActivityIndicator color={colors.navy} />
                    ) : (
                      <View style={styles.chevron}>
                        <Chevron
                          width={CHEVRON}
                          height={CHEVRON}
                          color={colors.textMuted}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <PasswordPromptModal
        visible={askPassword}
        title={FACE_LOCK_COPY.passwordTitle}
        label={FACE_LOCK_COPY.passwordLabel}
        placeholder={FACE_LOCK_COPY.passwordPlaceholder}
        submitting={checking}
        error={passwordError}
        onSubmit={confirmPassword}
        onClose={() => {
          setAskPassword(false);
          setPasswordError(null);
        }}
      />

      <FaceScanModal
        visible={scanning}
        title={FACE_LOCK_COPY.scanTitle}
        hint={FACE_LOCK_COPY.scanHint}
        scanningHint={FACE_LOCK_COPY.scanningHint}
        actionText={actionLabel}
        onScanned={finishScan}
        onClose={() => setScanning(false)}
      />

      <ErrorModal {...modalProps} />
    </SafeAreaView>
  );
}
