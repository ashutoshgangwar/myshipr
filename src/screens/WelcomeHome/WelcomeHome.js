import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import styles from './WelcomeHome.styles';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';

const WelcomeHome = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (loading) return;
    setLoading(true);
    navigation.navigate('Onboarding');
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Text style={styles.truckIcon}>🚚</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Aboard!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Let's get you set up. We'll need some documents and information to
            verify your account.
          </Text>

          {/* Steps Card */}
          <View style={styles.card}>
            <View style={styles.stepRow}>
              <Text style={styles.check}>✓</Text>
              <View>
                <Text style={styles.stepTitle}>Upload Required Documents</Text>
                <Text style={styles.stepSub}>
                  CDL, Medical Certificate, Insurance
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <Text style={styles.check}>✓</Text>
              <View>
                <Text style={styles.stepTitle}>Add Vehicle Information</Text>
                <Text style={styles.stepSub}>
                  Registration, permits, and photos
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <Text style={styles.check}>✓</Text>
              <View>
                <Text style={styles.stepTitle}>Get Verified</Text>
                <Text style={styles.stepSub}>
                  Our team reviews in 24–48 hours
                </Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <Button
            title="Get Started"
            onPress={handleSubmit}
            textColor={colors.text_dark}
            backgroundColor={colors.white}
          />

          {/* Footer */}
          <Text style={styles.footerText}>
            Takes about 10–15 minutes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeHome;
