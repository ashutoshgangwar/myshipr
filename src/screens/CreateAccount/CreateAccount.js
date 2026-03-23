import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import styles from './CreateAccount.styles';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';

const CreateAccount = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = () => {
    if (loading) return;
    setLoading(true);
    navigation.navigate('VerifyPhone');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <AppText style={styles.title}>Create Account</AppText>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Personal details</AppText>
            <AppText style={styles.sectionSubtitle}>
              Tell us about you to personalize your account.
            </AppText>
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Company Name *</AppText>
            <TextInput
              style={styles.input}
              placeholder="XYZ Corp"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="organizationName"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.fieldHalf, styles.fieldLeft]}>
              <AppText style={styles.label}>First Name *</AppText>
              <TextInput
                style={styles.input}
                placeholder="Ashutosh"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
              />
            </View>
            

            <View style={styles.fieldHalf}>
              <AppText style={styles.label}>Middle Name *</AppText>
              <TextInput
                style={styles.input}
                placeholder="Kumar"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Last Name</AppText>
            <TextInput
              style={styles.input}
              placeholder="Gangwar"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="lastName"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Email Address *</AppText>
            <TextInput
              style={styles.input}
              placeholder="xyz@example.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Phone Number *</AppText>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <AppText style={styles.countryText}>+1</AppText>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Password *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Create a strong password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Confirm Password *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.7}
            onPress={() => setTermsAccepted(prev => !prev)}>
            <View
              style={[
                styles.checkbox,
                termsAccepted && styles.checkboxChecked,
              ]}>
              {termsAccepted && <AppText style={styles.checkboxTick}>✓</AppText>}
            </View>
            <AppText style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </AppText>
          </TouchableOpacity>

          <View style={styles.buttonWrap}>
            <Button
              title={loading ? 'Creating...' : 'Create Account'}
              onPress={handleSubmit}
              textColor={colors.text_color_button}
              backgroundColor={colors.button_color}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateAccount;
