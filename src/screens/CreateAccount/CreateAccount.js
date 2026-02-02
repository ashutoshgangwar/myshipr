import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import styles from './CreateAccount.styles';
import {US_STATES} from '../../constants/usStates';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';

const CreateAccount = () => {
  const navigation = useNavigation();
  const [stateModal, setStateModal] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (loading) return;
       setLoading(true);
    navigation.navigate('VerifyPhone');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join as a professional driver</Text>

      {/* Full Name */}
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ashutosh Gangwar"
        placeholderTextColor="#9CA3AF"
      />

      {/* Email */}
      <Text style={styles.label}>Email Address *</Text>
      <TextInput
        style={styles.input}
        placeholder="xyz@example.com"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
      />

      {/* Phone */}
      <Text style={styles.label}>Phone Number *</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryText}>+1</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="(555) 123-4567"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      {/* CDL */}
      <Text style={styles.label}>CDL Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter CDL number"
        placeholderTextColor="#9CA3AF"
      />

      {/* State */}
      <Text style={styles.label}>CDL State *</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setStateModal(true)}>
        <Text style={styles.dropdownText}>
          {selectedState || 'Select State'}
        </Text>
      </TouchableOpacity>

      {/* Password */}
      <Text style={styles.label}>Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a strong password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
      />

      {/* Terms */}
      <View style={styles.termsRow}>
        <View style={styles.checkbox} />
        <Text style={styles.termsText}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </View>

      {/* Button */}
      <Button
        title="Create Account"
        onPress={handleSubmit}
        textColor={colors.white}
        backgroundColor={colors.primary}
      />

      {/* STATE MODAL */}
      <Modal visible={stateModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select CDL State</Text>

          <FlatList
            data={US_STATES}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.stateItem}
                onPress={() => {
                  setSelectedState(item);
                  setStateModal(false);
                }}>
                <Text style={styles.stateText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setStateModal(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CreateAccount;
