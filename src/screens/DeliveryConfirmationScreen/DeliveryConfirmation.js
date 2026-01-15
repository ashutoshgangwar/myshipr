import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './DeliveryConfirmation.styles';
import CoreButton from '../../component/CoreButton/CoreButton';

const DeliveryConfirmation= () => {
  const [checked, setChecked] = useState({
    cargo: false,
    photos: false,
    pod: false,
    location: false,
  });

  const allChecked = Object.values(checked).every(Boolean);

  const toggleCheck = key =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Stepper */}
        <View style={styles.stepper}>
          <Text style={styles.stepDone}>Pickup</Text>
          <View style={styles.stepLine} />
          <Text style={styles.stepDone}>Transit</Text>
          <View style={styles.stepLine} />
          <Text style={styles.stepActive}>Delivery</Text>
        </View>

        {/* Delivery Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Details</Text>

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
          <Text style={styles.cardTitle}>Digital Proof of Delivery</Text>

          <InfoRow label="Timestamp" value="Auto captured" />
          <InfoRow label="Location" value="GPS locked" />

          <TouchableOpacity style={styles.podUpload}>
            <Text style={styles.podText}>Upload Signature / POD</Text>
          </TouchableOpacity>
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Completion Checklist</Text>

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
      <View style={styles.footer}>
        <CoreButton
          title="Complete Delivery"
          disabled={!allChecked}
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
};

/* ---------- Small Components ---------- */

const UploadBox = ({ label }) => (
  <TouchableOpacity style={styles.uploadBox}>
    <Text style={styles.uploadIcon}>📷</Text>
    <Text style={styles.uploadLabel}>{label}</Text>
  </TouchableOpacity>
);

const IssueToggle = ({ label, danger }) => (
  <View style={[styles.issueBox, danger && styles.issueDanger]}>
    <Text style={styles.issueText}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ChecklistItem = ({ label, checked, onPress }) => (
  <TouchableOpacity style={styles.checkRow} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
    <Text style={styles.checkText}>{label}</Text>
  </TouchableOpacity>
);

export default DeliveryConfirmation;
