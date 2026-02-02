import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import styles from './Onboarding.styles';
import { useNavigation } from '@react-navigation/native';

const TABS = ['Documents', 'Vehicle Info', 'Review'];

const Onboarding = () => {
    const navigation = useNavigation()
   const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Documents');

  const goNext = () => {
    if (activeTab === 'Documents') setActiveTab('Vehicle Info');
    else if (activeTab === 'Vehicle Info') setActiveTab('Review');
  };

  const goBack = () => {
    if (activeTab === 'Review') setActiveTab('Vehicle Info');
    else if (activeTab === 'Vehicle Info') setActiveTab('Documents');
  };



  const handleReviewDoc= () => {
    if (loading) return;
    setLoading(false)
    navigation.navigate('MainApp');
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Onboarding</Text>
          <Text style={styles.skip}>Skip for now</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBar} />
        <Text style={styles.progressText}>0% Complete</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------------- DOCUMENTS ---------------- */}
        {activeTab === 'Documents' && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={{fontWeight: '700'}}>Required:</Text> Upload all
                documents marked with * to proceed. Accepted formats: PDF, JPG,
                PNG (max 10MB)
              </Text>
            </View>

            {[
              "CDL (Commercial Driver's License)",
              'DOT Medical Certificate',
              'Medical certificate'
            ].map(title => (
              <View style={styles.card} key={title}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{title} *</Text>
                  {/* <View style={styles.status}>
                    <Text style={styles.statusText}>Pending</Text>
                  </View> */}
                </View>

                <View style={styles.uploadBox}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>Take Photo or Upload</Text>
                  <Text style={styles.uploadSub}>
                    PDF, JPG, PNG · Max 10MB
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ---------------- VEHICLE INFO ---------------- */}
        {activeTab === 'Vehicle Info' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <Text style={styles.label}>Vehicle Type *</Text>
            <TextInput style={styles.input} value="Semi-Truck (18-Wheeler)" />

            <Text style={styles.label}>VIN Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="1HGBH41JXMN109186"
            />

            <Text style={styles.label}>License Plate *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="ABC1234"
              />
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="CA"
              />
            </View>

            <Text style={styles.label}>Capacity (lbs) *</Text>
            <TextInput
              style={styles.input}
              placeholder="45000"
              keyboardType="numeric"
            />

            <Text style={styles.label}>GPS Device ID</Text>
            <TextInput style={styles.input} placeholder="Optional" />
          </View>
        )}

        {/* ---------------- REVIEW ---------------- */}
        {activeTab === 'Review' && (
          <>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>Almost Done!</Text>
              <Text style={styles.reviewSub}>
                Review your information and submit for verification. Our team
                will review within 24–48 hours.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Documents Uploaded</Text>

              {[
                'Commercial Driver’s License (CDL)',
                'DOT Medical Certificate',
                'Vehicle Registration & Insurance',
              ].map(item => (
                <View style={styles.reviewRow} key={item}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.reviewText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>What happens next?</Text>

              {[
                ['1', 'Document Verification', 'Our compliance team reviews all documents'],
                ['2', 'DMV & Background Check', 'Automated verification of license and registration'],
                ['3', 'Account Activation', 'You’ll receive a notification when approved'],
              ].map(([num, title, desc]) => (
                <View style={styles.timelineRow} key={num}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>{num}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{title}</Text>
                    <Text style={styles.stepDesc}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.reviewFooter}>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity 
              onPress={handleReviewDoc}
              style={styles.submitBtn}>
                <Text style={styles.submitText}>Submit for Review</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* -------- FIXED BOTTOM CTA (NOT FOR REVIEW) -------- */}
      {activeTab !== 'Review' && (
        <View style={styles.bottomFixed}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              activeTab === 'Documents' && styles.disabledBtn,
            ]}
            disabled={activeTab === 'Documents'}
            onPress={goNext}>
            <Text
              style={[
                styles.primaryText,
                activeTab === 'Documents' && styles.disabledText,
              ]}>
              {activeTab === 'Documents'
                ? 'Continue to Vehicle Info'
                : 'Continue to Review'}
            </Text>
          </TouchableOpacity>

          {activeTab === 'Documents' && (
            <Text style={styles.bottomText}>
              Upload 5 more required document(s)
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default Onboarding;
