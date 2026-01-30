import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import styles from './ForgotPassword.styles';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';

const STATIC_OTP = '123456';

const ForgotPassword = ({navigation}) => {
  const [method, setMethod] = useState('mobile');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const sendOtp = () => {
    if (method === 'mobile' && value.length !== 10) {
      alert('Enter valid mobile number');
      return;
    }

    if (method === 'email' && !value.includes('@')) {
      alert('Enter valid email');
      return;
    }

    setIsOtpSent(true);
    alert(`OTP sent! Use ${STATIC_OTP}`);
  };

  const verifyOtp = () => {
    if (otp !== STATIC_OTP) {
      alert('Invalid OTP');
      return;
    }
    navigation.navigate('ResetPassword');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require('../../assets/Image/logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Forgot Password</Text>

      {/* Toggle */}
      <View style={styles.toggle}>
        {['mobile', 'email'].map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.toggleBtn, method === item && styles.activeToggle]}
            onPress={() => {
              setMethod(item);
              setValue('');
            }}>
            <Text style={method === item ? styles.activeText : styles.text}>
              {item === 'mobile' ? 'Mobile' : 'Email'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder={
          method === 'mobile' ? 'Enter Mobile Number' : 'Enter Email'
        }
        keyboardType={method === 'mobile' ? 'number-pad' : 'email-address'}
        value={value}
        onChangeText={setValue}
        maxLength={method === 'mobile' ? 10 : 50}
        style={styles.input}
      />

      {!isOtpSent ? (
        <Button
          title="Send OTP"
          onPress={sendOtp}
          textColor={colors.text_color_button}
          backgroundColor={colors.button_color}
        />
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            style={styles.input}
          />
          <Button
            title="Verify OTP"
            onPress={verifyOtp}
            textColor={colors.text_color_button}
            backgroundColor={colors.button_color}
          />
        </>
      )}
    </View>
  );
};

export default ForgotPassword;
