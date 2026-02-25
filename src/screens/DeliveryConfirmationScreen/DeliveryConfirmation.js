import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './DeliveryConfirmation.styles';
import CoreButton from '../../component/CoreButton/CoreButton';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../theme/AppText';

const DeliveryConfirmation = () => {
   const navigate = useNavigation();
  const [checked, setChecked] = useState({
    cargo: false,
    photos: false,
    pod: false,
    location: false,
  });

  const allChecked = Object.values(checked).every(Boolean);

  const toggleCheck = key => setChecked(prev => ({...prev, [key]: !prev[key]}));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stepper */}
        <View style={styles.stepper}>
          <AppText style={styles.stepDone}>Pickup</AppText>
          <View style={styles.stepLine} />
          <AppText style={styles.stepDone}>Transit</AppText>
          <View style={styles.stepLine} />
          <AppText style={styles.stepActive}>Delivery</AppText>
        </View>

        {/* Delivery Card */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Delivery Details</AppText>

          {/* Upload Section */}
          <View style={styles.uploadRow}>
            <UploadBox label="Cargo Photo" />
            <UploadBox label="Seal Photo" />
            <UploadBox label="Dock Photo" />
          </View>

          {/* Issues */}
          <View style={styles.issueRow}>
            <IssueToggle label="Partial Delivery" />
            <IssueToggle label="Damaged Cargo" danger />
          </View>
        </View>

        {/* POD */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Digital Proof of Delivery</AppText>

          <InfoRow label="Timestamp" value="Auto captured" />
          <InfoRow label="Location" value="GPS locked" />

          <TouchableOpacity style={styles.podUpload}>
            <Text style={styles.podText}>Upload Signature / POD</Text>
          </TouchableOpacity>
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Completion Checklist</AppText>

          <ChecklistItem
            label="Cargo Verified"
            checked={checked.cargo}
            onPress={() => toggleCheck('cargo')}
          />
          <ChecklistItem
            label="All Photos Uploaded"
            checked={checked.photos}
            onPress={() => toggleCheck('photos')}
          />
          <ChecklistItem
            label="POD Attached"
            checked={checked.pod}
            onPress={() => toggleCheck('pod')}
          />
          <ChecklistItem
            label="Location Verified"
            checked={checked.location}
            onPress={() => toggleCheck('location')}
          />
        </View>
      </ScrollView>

      {/* Sticky Button */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <CoreButton
          title="Complete Delivery"
          // disabled={!allChecked}
         onPress={() => navigate.navigate('MainApp')}
          style={{ width: '100%', marginTop: 0 }}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

/* ---------- Small Components ---------- */

const UploadBox = ({label}) => (
  <TouchableOpacity style={styles.uploadBox}>
    <AppText style={styles.uploadIcon}>📷</AppText>
    <AppText style={styles.uploadLabel}>{label}</AppText>
  </TouchableOpacity>
);

const IssueToggle = ({label, danger}) => (
  <View style={[styles.issueBox, danger && styles.issueDanger]}>
    <AppText style={styles.issueText}>{label}</AppText>
  </View>
);

const InfoRow = ({label, value}) => (
  <View style={styles.infoRow}>
    <AppText style={styles.infoLabel}>{label}</AppText>
    <AppText style={styles.infoValue}>{value}</AppText>
  </View>
);

const ChecklistItem = ({label, checked, onPress}) => (
  <TouchableOpacity style={styles.checkRow} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
    <AppText style={styles.checkText}>{label}</AppText>
  </TouchableOpacity>
);

export default DeliveryConfirmation;
