import React, {useRef, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import styles from './ResetPassword.styles';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import {useNavigation} from '@react-navigation/native';
import AppText from '../../theme/AppText';

const ResetPassword = () => {
  const navigation = useNavigation();

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert('Password reset successfully');

      navigation.reset({
        index: 0,
        routes: [{name: 'LoginScreen'}],
      });
    }, 1000);
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
      <AppText style={styles.title}>Reset Password</AppText>
      <AppText style={styles.subtitle}>Create a new password</AppText>

      {/* New Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={passwordRef}
          placeholder="New Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.showHideButton}>
          {showPassword ? (
            <Eye_off width={22} height={22} />
          ) : (
            <Eye_outline width={22} height={22} />
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={confirmRef}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowConfirm(!showConfirm)}
          style={styles.showHideButton}>
          {showConfirm ? (
            <Eye_off width={22} height={22} />
          ) : (
            <Eye_outline width={22} height={22} />
          )}
        </TouchableOpacity>
      </View>

      <Button
        title={loading ? 'Resetting...' : 'Reset Password'}
        onPress={handleReset}
        disabled={loading}
        backgroundColor={colors.button_color}
        textColor={colors.text_color_button}
      />
    </View>
  );
};

export default ResetPassword;
