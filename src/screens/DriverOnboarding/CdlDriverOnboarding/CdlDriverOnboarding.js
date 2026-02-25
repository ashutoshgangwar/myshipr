import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

import ScreenHeader from '../../../component/ScreenHeader/ScreenHeader';
import OCRScanCard from '../../../component/OCRScanCard/OCRScanCard';
import EditableInfoRow from '../../../component/EditableInfoRow/EditableInfoRow';
import ActionButton from '../../../component/ActionButton/ActionButton';

import { scanWithCamera } from '../../../services/OCRService';
import { extractDriverData, extractMedicalData } from '../../../services/ocrParser';
import { colors } from '../../../theme/colors';
import styles from './CdlDriverOnboarding.styles';
import ConsentModal from '../../../component/ConsentModal/ConsentModal';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../../theme/AppText';

const CdlDriverOnboarding = () => {
  const navigation = useNavigation();

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [docs, setDocs] = useState({
    cdlImage: null,
    medicalImage: null,
    addressImage: null,
    ssnImage: null,
    backgroundConsent: '',
  });

  const [driver, setDriver] = useState({
    name: '',
    dob: '',
    license: '',
    state: '',
    expiry: '',
    medicalExpiry: '',
  });

  const scanDocument = async type => {
    try {
      const result = await scanWithCamera();
      if (!result?.image) return;

      setDocs(prev => ({ ...prev, [`${type}Image`]: result.image }));

      if (result.text) {
        if (type === 'cdl') {
          const data = extractDriverData(result.text);
          setDriver(prev => ({ ...prev, ...data }));
        }

        if (type === 'medical') {
          const data = extractMedicalData(result.text);
          setDriver(prev => ({ ...prev, ...data }));
        }
      }
    } catch (err) {
      console.log('Scan error:', err);
    }
  };

  const completedCount = [
    docs.cdlImage,
    docs.medicalImage,
    docs.addressImage,
    docs.ssnImage,
  ].filter(Boolean).length;

  const isSubmitEnabled =
    completedCount === 4 && driver.name && driver.license && driver.expiry;

  // Submit handler after user agrees
  const handleConsentAgree = async () => {
    setShowConsentModal(false);
    setDocs(prev => ({ ...prev, backgroundConsent: 'Given' }));
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('MainApp');
    }, 2000);
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <ScreenHeader title="Driver Onboarding" />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: moderateScale(16),
            paddingBottom: verticalScale(120),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <AppText style={styles.progressTitle}>Document Progress</AppText>
                <AppText style={styles.progressSub}>
                  {completedCount} of 4 documents completed
                </AppText>
              </View>
              <AppText  style={styles.progressPercent}>
                {Math.round((completedCount / 4) * 100)}%
              </AppText>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(completedCount / 4) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* CDL */}
          <OCRScanCard
            title="Commercial Driver License (CDL)"
            image={docs.cdlImage}
            placeholderImage={require('../../../assets/Image/sample_CDL.jpg')}
            status={docs.cdlImage ? 'completed' : 'pending'}
            onScan={() => scanDocument('cdl')}
          >
            <EditableInfoRow
              label="Full Name"
              value={driver.name}
              placeholder="Enter full name"
              onChangeText={text => setDriver(p => ({ ...p, name: text }))}
            />
            <EditableInfoRow
              label="License Number"
              value={driver.license}
              placeholder="Enter license number"
              onChangeText={text => setDriver(p => ({ ...p, license: text }))}
            />
            <EditableInfoRow
              label="Expiry Date"
              value={driver.expiry}
              placeholder="DD/MM/YYYY"
              onChangeText={text => setDriver(p => ({ ...p, expiry: text }))}
            />
          </OCRScanCard>

          {/* Medical */}
          <OCRScanCard
            title="Medical Examiner Certificate"
            image={docs.medicalImage}
            placeholderImage={require('../../../assets/Image/medical_cer.webp')}
            onScan={() => scanDocument('medical')}
          >
            <EditableInfoRow
              label="Medical Expiry"
              value={driver.medicalExpiry}
              placeholder="DD/MM/YYYY"
              onChangeText={text => setDriver(p => ({ ...p, medicalExpiry: text }))}
            />
          </OCRScanCard>

          {/* Address */}
          <OCRScanCard
            title="Proof of Address"
            image={docs.addressImage}
            placeholderImage={require('../../../assets/Image/pod_cer.webp')}
            onScan={() => scanDocument('address')}
          />

          {/* SSN */}
          <OCRScanCard
            title="Social Security / ITIN"
            image={docs.ssnImage}
            placeholderImage={require('../../../assets/Image/tin_cer.jpg')}
            onScan={() => scanDocument('ssn')}
          />

          {/* Floating Button */}
          <View style={styles.floatingButton}>
            <ActionButton
              title={submitting ? 'Submitting...' : 'Submit for Verification'}
              bgColor={isSubmitEnabled ? colors.primary : '#236fbbff'}
              textColor="#fff"
              onPress={() => setShowConsentModal(true)}
            />
          </View>

          {/* Consent Modal */}
          <ConsentModal
            visible={showConsentModal}
            onCancel={() => setShowConsentModal(false)}
            onAgree={handleConsentAgree}
          />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CdlDriverOnboarding;
