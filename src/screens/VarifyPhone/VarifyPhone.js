import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import styles from './VarifyPhone.styles';
import { useNavigation } from '@react-navigation/native';
import Button from '../../component/Button/Button';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';

const VerifyPhone = () => {
    const navigation = useNavigation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
   const [loading, setLoading] = useState(false);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };


  const handleSubmit = () => {
    if (loading) return;
       setLoading(true);
    navigation.navigate('WelcomeHome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Title */}
        <AppText style={styles.title}>Verify Phone</AppText>
        <AppText style={styles.subtitle}>
          Enter the 6-digit code sent to
        </AppText>
        <AppText style={styles.phoneText}>+1 (555) 123-4567</AppText>
        {/* OTP */}
        <View style={styles.otpRow}>
          {otp.map((item, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={styles.otpBox}
              maxLength={1}
              keyboardType="number-pad"
              value={item}
              onChangeText={(text) => handleChange(text, index)}
            />
          ))}
        </View>
 <Button
        title="Verify & Continue"
        onPress={handleSubmit}
        textColor={colors.white}
        backgroundColor={colors.primary}
      />
        {/* Button */}
        {/* <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Verify & Continue</Text>
        </TouchableOpacity> */}

        {/* Resend */}
        <AppText style={styles.resendText}>
          Didn’t receive code?{' '}
          <AppText style={styles.resendLink}>Resend</AppText>
        </AppText>
      </View>
    </View>
  );
};

export default VerifyPhone;
