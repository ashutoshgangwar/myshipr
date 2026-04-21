import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './DeliveryConfirmation.styles';
import CoreButton from '../../component/CoreButton/CoreButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../theme/AppText';
import { openCamera, openGallery } from '../../services/MediaService';
// Use the shared ReceiverSignaturePad used on HomeScreen
import ReceiverSignaturePad, { SIGNATURE_STORAGE_KEY } from '../../component/ReceiverSignaturePad/ReceiverSignaturePad';
import { getCurrentLocation } from '../../services/LocationService';
import DeliveryService from '../../services/DeliveryService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';
import Camera_Icon from '../../assets/svg_icon/photo-camera.svg'

const DeliveryConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { load } = route.params || {};

  const [checked, setChecked] = useState({
    cargo: false,
    photos: false,
    pod: false,
    location: false,
  });

  const [photo, setPhoto] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isReceiverPadVisible, setIsReceiverPadVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  // sigRef removed: using ReceiverSignaturePad component

  // Load saved receiver signature from HomeScreen's storage key (if available)
  React.useEffect(() => {
    let mounted = true;
    const loadStoredSignature = async () => {
      try {
        const raw = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
        if (!raw || !mounted) return;
        const parsed = JSON.parse(raw);
        if (parsed?.signature) {
          setSignatureData(parsed.signature);
          setChecked(c => ({...c, pod: true}));
        }
      } catch (e) {
        console.log('Error loading stored signature for delivery:', e);
      }
    };

    loadStoredSignature();
    return () => { mounted = false; };
  }, []);

  const allChecked = Object.values(checked).every(Boolean);

  const toggleCheck = key => setChecked(prev => ({...prev, [key]: !prev[key]}));

  const choosePhoto = async () => {
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: async () => {
          const asset = await openCamera();
          if (asset?.uri) {
            setPhoto(asset.uri);
            setChecked(c => ({...c, photos: true}));
          }
        }
      },
      { text: 'Gallery', onPress: async () => {
          const asset = await openGallery();
          if (asset?.uri) {
            setPhoto(asset.uri);
            setChecked(c => ({...c, photos: true}));
          }
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };


  const handleComplete = async () => {
    const allChecked = Object.values(checked).every(Boolean);
    if (!allChecked) {
      Alert.alert('Incomplete', 'Please complete all checklist items before confirming.');
      return;
    }

    setSaving(true);
    let location = null;
    try {
      location = await getCurrentLocation();
      setChecked(c => ({...c, location: true}));
    } catch (e) {
      console.warn('Location error', e.message);
    }

    const payload = {
      loadId: load?.id ?? 'unknown',
      timestamp: Date.now(),
      photo,
      signature: signatureData,
      checklist: checked,
      location,
    };

    try {
      await DeliveryService.saveDeliveryConfirmation(payload.loadId, payload);
      Alert.alert('Saved', 'Delivery confirmation saved successfully');
      navigation.navigate('MainApp');
    } catch (err) {
      console.log('Save error', err);
      Alert.alert('Error', 'Failed to save confirmation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />
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
              <UploadBox  value={photo} onPress={choosePhoto} />
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

          <TouchableOpacity
            style={[styles.podUpload, signatureData && styles.podUploadAttached]}
            onPress={() => setIsReceiverPadVisible(true)}
          >
            {signatureData ? (
              <View style={{ alignItems: 'center' }}>
                <View style={styles.signaturePreviewBorder}>
                  <Image source={{ uri: signatureData }} style={styles.signaturePreview} />
                </View>
                <AppText style={[styles.podTextDark, { marginTop: 8 }]}>Signature Attached</AppText>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => { setSignatureData(null); setIsReceiverPadVisible(true); }}
                >
                  <AppText style={styles.retakeButtonText}>Retake</AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <AppText style={styles.podText}>Capture Signature / POD</AppText>
            )}
          </TouchableOpacity>

          {/* ReceiverSignaturePad (shared UI from HomeScreen) */}
          <ReceiverSignaturePad
            visible={isReceiverPadVisible}
            useModal={true}
            onClose={() => setIsReceiverPadVisible(false)}
            onSaved={(payload) => {
              setSignatureData(payload.signature);
              setChecked(c => ({...c, pod: true}));
              setIsReceiverPadVisible(false);
            }}
            initialValue={signatureData ? { signature: signatureData } : null}
          />

          <AppText style={styles.cardTitleCheck}>Completion Checklist</AppText>

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
          disabled={!allChecked || saving}
         onPress={handleComplete}
          style={{ width: '100%', marginTop: 0 }}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

/* ---------- Small Components ---------- */

const UploadBox = ({label, value, onPress}) => (
  <TouchableOpacity style={styles.uploadBox} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.uploadPreviewWrap}>
      {value ? (
        <Image source={{ uri: value }} style={styles.uploadPreview} />
      ) : (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Camera_Icon width={80} height={80} />
        </View>
      )}
    </View>
    <AppText style={styles.uploadLabel}>{label}</AppText>
  </TouchableOpacity>
);

const IssueToggle = ({label, danger, onPress}) => (
  <TouchableOpacity style={[styles.issueBox, danger && styles.issueDanger]} onPress={onPress}>
    <AppText style={styles.issueText}>{label}</AppText>
  </TouchableOpacity>
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
