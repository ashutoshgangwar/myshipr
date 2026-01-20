import React, {useState} from 'react';
import {ScrollView, TouchableOpacity, Text, View} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import styles from './MedicalCertificate.styles';
import {scanWithCamera} from '../../../services/OCRService';
import {extractDriverData} from '../../../services/ocrParser';
import ScreenHeader from '../../../component/ScreenHeader/ScreenHeader';
import OCRScanCard from '../../../component/OCRScanCard/OCRScanCard';
import EditableInfoRow from '../../../component/EditableInfoRow/EditableInfoRow';
import ActionButton from '../../../component/ActionButton/ActionButton';
import {colors} from '../../../theme/colors';
import { useNavigation } from '@react-navigation/native';

const MedicalCertificate = () => {
  const navigate = useNavigation();
  const [image, setImage] = useState(null);
  const [driver, setDriver] = useState({
    name: '',
    dob: '',
    license: '',
    state: '',
    expiry: '',
  });

  const handleScan = async () => {
    const result = await scanWithCamera();
    if (!result?.text) return;

    setImage(result.image);
    const extracted = extractDriverData(result.text);
    setDriver(prev => ({...prev, ...extracted}));
  };

  return (
    <View style={styles.screen}>
      {/* Full-width header at top */}
      <ScreenHeader title="Medical Verification" />

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          marginTop: verticalScale(20),
          paddingHorizontal: moderateScale(16),
          paddingBottom: verticalScale(60),
        }}
        showsVerticalScrollIndicator={false}>
        {/* Scan Card */}
         <OCRScanCard
        title="Medical Certificate"
        image={image}
        placeholderImage={require('./../../../assets/Image/medical_cer.webp')} // dynamic
        onScan={handleScan}
      />

        {/* Editable Info Card */}
        <OCRScanCard title="Extracted Driver Information">
          <EditableInfoRow
            label="Full Name"
            value={driver.name}
            placeholder="Enter full name"
            onChangeText={text => setDriver(prev => ({...prev, name: text}))}
          />
          <EditableInfoRow
            label="DOB"
            value={driver.dob}
            placeholder="Enter date of birth"
            onChangeText={text => setDriver(prev => ({...prev, dob: text}))}
          />
          <EditableInfoRow
            label="License Number"
            value={driver.license}
            placeholder="Enter license number"
            onChangeText={text => setDriver(prev => ({...prev, license: text}))}
          />
          <EditableInfoRow
            label="State (DMV)"
            value={driver.state}
            placeholder="Enter state"
            onChangeText={text => setDriver(prev => ({...prev, state: text}))}
          />
          <EditableInfoRow
            label="Expiry Date"
            value={driver.expiry}
            placeholder="Enter expiry date"
            onChangeText={text => setDriver(prev => ({...prev, expiry: text}))}
          />
        </OCRScanCard>
        <ActionButton
          title="Submit for Verification"
          bgColor={colors.primary}
          textColor="#fff"
          onPress={() => navigate.navigate('SocialSecurityItin')}
        />
      </ScrollView>
    </View>
  );
};

export default MedicalCertificate;
