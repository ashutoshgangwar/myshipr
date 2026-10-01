import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import styles from './Onboarding.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../../component/Button/Button';
import ErrorModal from '../../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../../hooks/useErrorModal';
import {colors} from '../../../theme/colors';
import StatusBar from '../../../component/StatusBar/StatusBar';
import AppText from '../../../theme/AppText';
import {vs} from '../../../theme/scale';

const Onboarding = () => {
  const navigation = useNavigation();
  // The app's one dialog — see `hooks/useErrorModal`.
  const {modalProps, showWarning} = useErrorModal();
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [faxNumber, setFaxNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [insuranceDetails, setInsuranceDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10,15}$/;
  const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;
  const onlyDigits = (value: string): string => value.replace(/\D/g, '');
  const isCompleteProfileDisabled =
    loading ||
    !companyName.trim() ||
    !companyAddress.trim() ||
    !dotNumber.trim() ||
    !mcNumber.trim() ||
    !companyWebsite.trim() ||
    !phone.trim() ||
    !companyEmail.trim() ||
    !insuranceDetails.trim();

  const handleLogin = () => {
    if (loading) {
      return;
    }

    const companyNameValue = companyName.trim();
    const companyAddressValue = companyAddress.trim();
    const dotNumberValue = dotNumber.trim();
    const mcNumberValue = mcNumber.trim();
    const companyWebsiteValue = companyWebsite.trim();
    const phoneValue = phone.trim();
    const alternatePhoneValue = alternatePhone.trim();
    const faxNumberValue = faxNumber.trim();
    const companyEmailValue = companyEmail.trim();
    const insuranceDetailsValue = insuranceDetails.trim();

    if (!companyNameValue) {
      showWarning('Required Field', 'Please enter company name');
      return;
    }

    if (!companyAddressValue) {
      showWarning('Required Field', 'Please enter company address');
      return;
    }

    if (!dotNumberValue || dotNumberValue.length < 5) {
      showWarning('Invalid DOT Number', 'Please enter a valid DOT number');
      return;
    }

    if (!mcNumberValue || mcNumberValue.length < 5) {
      showWarning('Invalid MC Number', 'Please enter a valid MC number');
      return;
    }

    if (!companyWebsiteValue) {
      showWarning('Required Field', 'Please enter company website');
      return;
    }

    if (!websiteRegex.test(companyWebsiteValue)) {
      showWarning('Invalid Website', 'Please enter a valid company website');
      return;
    }

    if (!phoneValue || !phoneRegex.test(phoneValue)) {
      showWarning('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    if (alternatePhoneValue && !phoneRegex.test(alternatePhoneValue)) {
      showWarning(
        'Invalid Alternate Phone Number',
        'Please enter a valid alternate phone number',
      );
      return;
    }

    if (alternatePhoneValue && alternatePhoneValue === phoneValue) {
      showWarning(
        'Invalid Alternate Phone Number',
        'Alternate phone number must be different from phone number',
      );
      return;
    }

    if (faxNumberValue && !phoneRegex.test(faxNumberValue)) {
      showWarning('Invalid Fax Number', 'Please enter a valid fax number');
      return;
    }

    if (!companyEmailValue || !emailRegex.test(companyEmailValue)) {
      showWarning(
        'Invalid Company Email',
        'Please enter a valid company email',
      );
      return;
    }

    if (!insuranceDetailsValue) {
      showWarning('Required Field', 'Please enter insurance details');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // TODO: Replace with real authentication logic
      navigation.reset({
        index: 0,
        routes: [{name: 'CdlDriverOnboarding'}],
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? vs(6) : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={styles.safe}
          edges={['bottom']}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent={true}
          />
          <ScrollView
            style={{backgroundColor: colors.white}}
            contentContainerStyle={[styles.container, {backgroundColor: colors.white}]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="never"
            endFillColor={colors.white}>
            <View style={styles.screenShell}>
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={[
                    colors.overlayDarkStartTransparent,
                    colors.overlayDarkMidStrong,
                    colors.primary,
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.heroOverlay}>
                  <View style={styles.heroContent}>
                    <AppText style={styles.title}>You’re Almost Done!</AppText>
                    <AppText style={styles.subtitle}>
                      Complete your carrier profile to access services.
                    </AppText>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.card} accessibilityLabel="Signup form">
                <AppText style={styles.label}>Company Name</AppText>
                <TextInput
                  placeholder="Enter your company name"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={companyName}
                  onChangeText={setCompanyName}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Company name input"
                  editable={!loading}
                />
                <AppText style={styles.label}>Company Address</AppText>
                <TextInput
                  placeholder="Enter company address"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={companyAddress}
                  onChangeText={setCompanyAddress}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="company address input"
                  editable={!loading}
                />

                <AppText style={styles.label}>DOT Number</AppText>
                <TextInput
                  placeholder="Enter dot number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={dotNumber}
                  onChangeText={text => setDotNumber(onlyDigits(text))}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="dot number input"
                  editable={!loading}
                />

                <AppText style={styles.label}>MC Number</AppText>
                <TextInput
                  placeholder="Enter mc number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={mcNumber}
                  onChangeText={text => setMcNumber(onlyDigits(text))}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="mc number input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Company Website</AppText>
                <TextInput
                  placeholder="Enter company website"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={companyWebsite}
                  onChangeText={setCompanyWebsite}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="company website input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Phone Number</AppText>
                <TextInput
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={phone}
                  onChangeText={text => setPhone(onlyDigits(text))}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="phone number input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Alternate Phone Number</AppText>
                <TextInput
                  placeholder="Enter alternate phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={alternatePhone}
                  onChangeText={text => setAlternatePhone(onlyDigits(text))}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="alternate phone number input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Company Fax Number</AppText>
                <TextInput
                  placeholder="Enter fax number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={faxNumber}
                  onChangeText={text => setFaxNumber(onlyDigits(text))}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="fax number input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Company Email</AppText>
                <TextInput
                  placeholder="Enter company email id"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={companyEmail}
                  onChangeText={setCompanyEmail}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="company email input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Insurance Details</AppText>
                <TextInput
                  placeholder="Enter insurance details"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={insuranceDetails}
                  onChangeText={setInsuranceDetails}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="insurance details input"
                  editable={!loading}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomActionContainer}>
            {loading ? (
              <View style={[styles.button, styles.loadingButton]}>
                <ActivityIndicator
                  color={colors.textStrong || colors.white}
                  size="small"
                />
              </View>
            ) : (
              <Button
                title="Complete Profile"
                onPress={handleLogin}
                backgroundColor={colors.primary}
                textColor={colors.white}
                style={[styles.primaryButton, styles.footerButton]}
                textStyle={styles.primaryButtonText}
                disabled={isCompleteProfileDisabled}
              />
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <ErrorModal {...modalProps} />
    </KeyboardAvoidingView>
  );
};

export default Onboarding;
