import React, {useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
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
import { GOOGLE_MAPS_API_KEY } from '@env';
import DeliveryService from '../../services/DeliveryService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';
import type {Coordinates, ErrorLike} from '../../types/common';
import type {RootStackScreenProps} from '../../types/navigation';

/** The four confirmation steps the driver ticks off. */
type ChecklistKey = 'cargo' | 'photos' | 'pod' | 'location';
import Camera_Icon from '../../assets/svg_icon/photo-camera.svg'

const DeliveryConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute<RootStackScreenProps<'DeliveryConfirmation'>['route']>();
  const { load } = route.params || {};

  const [checked, setChecked] = useState({
    cargo: false,
    photos: false,
    pod: false,
    location: false,
  });

  const [photo, setPhoto] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isReceiverPadVisible, setIsReceiverPadVisible] = useState(false);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<
    (Coordinates & {accuracy?: number}) | null
  >(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
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

  // Auto-capture timestamp and GPS on mount
  React.useEffect(() => {
    let mounted = true;
    const capture = async () => {
      setLocationLoading(true);
      try {
        const pos = await getCurrentLocation();
        if (!mounted) return;
        setLocationCoords({ latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy });
        setCapturedAt(new Date().toISOString());
        setChecked(c => ({ ...c, location: true }));
        // reverse geocode
        try {
          const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.latitude},${pos.longitude}&key=${GOOGLE_MAPS_API_KEY}`);
          const geoJson = await geoRes.json();
          if (geoJson?.results && geoJson.results.length) {
            setLocationAddress(geoJson.results[0].formatted_address);
          }
        } catch (e) {
          console.warn('Reverse geocode failed', (e as ErrorLike)?.message || e);
        }
      } catch (e) {
        console.warn('Auto-capture location failed', (e as ErrorLike)?.message || e);
        setCapturedAt(new Date().toISOString());
      } finally {
        if (mounted) setLocationLoading(false);
      }
    };

    capture();
    return () => { mounted = false; };
  }, []);

  const allChecked = Object.values(checked).every(Boolean);

  const toggleCheck = (key: ChecklistKey) =>
    setChecked(prev => ({...prev, [key]: !prev[key]}));

  const choosePhoto = async () => {
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: async () => {
          const asset = await openCamera();
          if (asset?.uri) {
            await handlePhotoChosen(asset.uri);
          }
        }
      },
      { text: 'Gallery', onPress: async () => {
          const asset = await openGallery();
          if (asset?.uri) {
            await handlePhotoChosen(asset.uri);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // handle actions that should occur immediately after a photo is chosen/taken
  const handlePhotoChosen = async (uri: string) => {
    setPhoto(uri);
    setChecked(c => ({...c, photos: true}));

    setLocationLoading(true);
    try {
      const pos = await getCurrentLocation();
      setLocationCoords({ latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy });
      setCapturedAt(new Date().toISOString());
      setChecked(c => ({ ...c, location: true }));

      // reverse geocode
      try {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.latitude},${pos.longitude}&key=${GOOGLE_MAPS_API_KEY}`);
        const geoJson = await geoRes.json();
        if (geoJson?.results && geoJson.results.length) {
          setLocationAddress(geoJson.results[0].formatted_address);
        }
      } catch (e) {
        console.warn('Reverse geocode after photo failed', (e as ErrorLike)?.message || e);
      }
    } catch (e) {
      console.warn('Location capture after photo failed', (e as ErrorLike)?.message || e);
    } finally {
      setLocationLoading(false);
    }
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
      console.warn('Location error', (e as ErrorLike).message);
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
          {/* NOTE: `styles.stepActive` is not defined in
              DeliveryConfirmation.styles — it was undefined and RN skipped
              it, so this label never had the active styling. */}
          <AppText>Delivery</AppText>
        </View>

        {/* Delivery Card */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Delivery Details</AppText>

          {/* Upload Section */}
            <View style={styles.uploadRow}>
              <UploadBox  value={photo} onPress={choosePhoto} />
            </View>
        </View>

        {/* POD */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Digital Proof of Delivery</AppText>

          <InfoRow label="Timestamp" value={capturedAt ? new Date(capturedAt).toLocaleString() : (locationLoading ? 'Capturing...' : 'Not captured')} />
          <InfoRow label="Location" value={locationAddress ? locationAddress : (locationCoords ? `${locationCoords.latitude.toFixed(5)}, ${locationCoords.longitude.toFixed(5)}` : (locationLoading ? 'Capturing...' : 'Unavailable'))} />

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
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

/* ---------- Small Components ---------- */

const UploadBox = ({
  label,
  value,
  onPress,
}: {
  label?: string;
  value?: string | null;
  onPress?: () => void;
}) => (
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

// const IssueToggle = ({label, danger, onPress}) => (
//   <TouchableOpacity style={[styles.issueBox, danger && styles.issueDanger]} onPress={onPress}>
//     <AppText style={styles.issueText}>{label}</AppText>
//   </TouchableOpacity>
// );

const InfoRow = ({
  label,
  value,
}: {
  label?: string;
  value?: string | null;
}) => (
  <View style={styles.infoRow}>
    <AppText style={styles.infoLabel}>{label}</AppText>
    <AppText style={styles.infoValue} numberOfLines={2} ellipsizeMode={'tail'}>{value}</AppText>
  </View>
);

const ChecklistItem = ({
  label,
  checked,
  onPress,
}: {
  label?: string;
  checked?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.checkRow} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
    <AppText style={styles.checkText}>{label}</AppText>
  </TouchableOpacity>
);

export default DeliveryConfirmation;
