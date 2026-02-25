import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import styles from './Onboarding.styles';
import {useNavigation} from '@react-navigation/native';
import StatusBar from '../../component/StatusBar/StatusBar';
import {colors} from '../../theme/colors';
import {scanWithCamera, scanWithGallery} from '../../services/OCRService';
import Button from '../../component/Button/Button';
import AppText from '../../theme/AppText';

const TABS = ['Company Info', 'Documents', 'Review'];

const DOCUMENTS = [
  {id: 'insurance', title: 'Insurance Image'},
  {id: 'commercial_liability', title: 'Commercial Liability Insurance'},
];

const Onboarding = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Company Info');
  const [documents, setDocuments] = useState({});

  const completedCount = DOCUMENTS.filter(doc => documents[doc.id]).length;
  const canContinueFromDocs = completedCount === DOCUMENTS.length;

  const goNext = () => {
    if (activeTab === 'Company Info') setActiveTab('Documents');
    else if (activeTab === 'Documents') setActiveTab('Review');
  };

  const goBack = () => {
    if (activeTab === 'Review') setActiveTab('Documents');
    else if (activeTab === 'Documents') setActiveTab('Company Info');
  };

  const handleReviewDoc = () => {
    if (loading) return;
    setLoading(false);
    navigation.navigate('MainApp');
  };

  const scanDocument = async (docId, source) => {
    try {
      const result =
        source === 'gallery' ? await scanWithGallery() : await scanWithCamera();
      if (!result?.image) return;

      setDocuments(prev => ({...prev, [docId]: result.image}));
    } catch (err) {
      console.log('Scan error:', err);
    }
  };

  const handleDocumentPress = docId => {
    Alert.alert('Upload document', 'Choose an option', [
      {text: 'Take Photo', onPress: () => scanDocument(docId, 'camera')},
      {
        text: 'Upload from Gallery',
        onPress: () => scanDocument(docId, 'gallery'),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>Complete Onboarding</AppText>
        </View>

        {/* Progress */}
        <View style={styles.progressBar} />
        <AppText style={styles.progressText}>0% Complete</AppText>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}>
              <AppText
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------------- Company Info ---------------- */}
        {activeTab === 'Company Info' && (
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>Company Information</AppText>
            <View style={styles.field}>
              <AppText style={styles.label}>Company Address *</AppText>
              <TextInput
                style={styles.input}
                placeholder="123 Main St, City, State"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>DOT Number *</AppText>
                <TextInput style={styles.input} placeholder="DOT123456" />
              </View>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>MC Number *</AppText>
                <TextInput style={styles.input} placeholder="MC123456" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>State *</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="CA"
                  autoCapitalize="characters"
                />
              </View>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>Company Phone *</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="(123) 456-7890"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>Company Fax</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="(123) 456-7890"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.field, styles.fieldHalf]}>
                <AppText style={styles.label}>Company Email *</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="example@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.field}>
              <AppText style={styles.label}>Company Website</AppText>
              <TextInput
                style={styles.input}
                placeholder="https://www.example.com"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* ---------------- DOCUMENTS ---------------- */}
        {activeTab === 'Documents' && (
          <>
            <View style={styles.infoBox}>
              <AppText style={styles.infoText}>
                <AppText style={{fontWeight: '700'}}>Required:</AppText> Upload all
                documents marked with * to proceed. Accepted formats: PDF, JPG,
                PNG (max 10MB)
              </AppText>
            </View>

            {DOCUMENTS.map(({id, title}) => (
              <View style={styles.card} key={id}>
                <View style={styles.cardHeader}>
                  <AppText style={styles.cardTitle}>{title} *</AppText>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDocumentPress(id)}
                  style={styles.uploadBox}>
                  {documents[id]?.uri ? (
                    <>
                      <Image
                        source={{uri: documents[id].uri}}
                        style={styles.uploadPreview}
                        resizeMode="cover"
                      />
                      <AppText style={styles.uploadText}>Retake Photo</AppText>
                    </>
                  ) : (
                    <>
                      <AppText style={styles.uploadIcon}>📷</AppText>
                      <AppText style={styles.uploadText}>
                        Take Photo or Upload
                      </AppText>
                      <AppText style={styles.uploadSub}>
                        PDF, JPG, PNG · Max 10MB
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
        {/* ---------------- REVIEW ---------------- */}
        {activeTab === 'Review' && (
          <>
            <View style={styles.reviewHeader}>
              <AppText style={styles.reviewTitle}>Almost Done!</AppText>
              <AppText  Text style={styles.reviewSub}>
                Review your information and submit for verification. Our team
                will review within 24–48 hours.
              </AppText>
            </View>

            <View style={styles.card}>
              <AppText style={styles.sectionTitle}>Documents Uploaded</AppText>

              {[
                'Commercial Driver’s License (CDL)',
                'DOT Medical Certificate',
                'Vehicle Registration & Insurance',
              ].map(item => (
                <View style={styles.reviewRow} key={item}>
                  <AppText style={styles.checkIcon}>✓</AppText>
                  <AppText style={styles.reviewText}>{item}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <AppText style={styles.sectionTitle}>What happens next?</AppText>

              {[
                [
                  '1',
                  'Document Verification',
                  'Our compliance team reviews all documents',
                ],
                [
                  '2',
                  'DMV & Background Check',
                  'Automated verification of license and registration',
                ],
                [
                  '3',
                  'Account Activation',
                  'You’ll receive a notification when approved',
                ],
              ].map(([num, title, desc]) => (
                <View style={styles.timelineRow} key={num}>
                  <View style={styles.stepCircle}>
                    <AppText style={styles.stepNumber}>{num}</AppText>
                  </View>
                  <View style={styles.stepContent}>
                    <AppText style={styles.stepTitle}>{title}</AppText>
                    <AppText style={styles.stepDesc}>{desc}</AppText>
                  </View>
                </View>
              ))}
            </View>

            <Button
              title="Submit for Review"
              onPress={handleReviewDoc}
              textColor={colors.white}
              backgroundColor={colors.primary}
            />
          </>
        )}
      </ScrollView>

      {/* -------- FIXED BOTTOM CTA (NOT FOR REVIEW) -------- */}
      {activeTab !== 'Review' && (
        <View style={styles.bottomFixed}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              activeTab === 'Documents' &&
                !canContinueFromDocs &&
                styles.disabledBtn,
            ]}
            disabled={activeTab === 'Documents' && !canContinueFromDocs}
            onPress={goNext}>
            <AppText
              style={[
                styles.primaryText,
                activeTab === 'Documents' &&
                  !canContinueFromDocs &&
                  styles.disabledText,
              ]}>
              {activeTab === 'Company Info'
                ? 'Continue to Documents'
                : 'Continue to Review'}
            </AppText>
          </TouchableOpacity>

          {activeTab === 'Documents' && (
            <AppText style={styles.bottomText}>
              Upload {Math.max(DOCUMENTS.length - completedCount, 0)} more
              required document(s)
            </AppText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default Onboarding;
