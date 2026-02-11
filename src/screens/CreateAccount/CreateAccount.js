import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import styles from './CreateAccount.styles';
import {Roles} from '../../constants/Roles';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import StatusBar from '../../component/StatusBar/StatusBar';

const CreateAccount = () => {
  const navigation = useNavigation();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join as a professional driver</Text>


        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ashutosh Gangwar"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
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

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryText}>+1</Text>
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

          {/* Role */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setRoleDropdownOpen(prev => !prev)}>
                <View style={styles.dropdownRow}>
                  <Text
                    style={[
                      styles.dropdownText,
                      !selectedRole && styles.dropdownPlaceholder,
                    ]}>
                    {selectedRole || 'Select Role'}
                  </Text>
                  <Text style={styles.dropdownChevron}>
                    {roleDropdownOpen ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {roleDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {Roles.map(role => (
                    <TouchableOpacity
                      key={role.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedRole(role.label);
                        setRoleDropdownOpen(false);
                      }}>
                      <Text style={styles.dropdownItemText}>{role.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a strong password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              textContentType="password"
            />
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.7}
            onPress={() => setTermsAccepted(prev => !prev)}>
            <View
              style={[
                styles.checkbox,
                termsAccepted && styles.checkboxChecked,
              ]}>
              {termsAccepted && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          {/* Button */}
          <View style={styles.buttonWrap}>
            <Button
              title="Create Account"
              onPress={handleSubmit}
              textColor={colors.text_color_button}
              backgroundColor={colors.button_color}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateAccount;
