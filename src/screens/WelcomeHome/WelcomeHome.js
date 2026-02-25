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
import StatusBar from '../../component/StatusBar/StatusBar';
import Truck_Icon from '../../assets/svg_icon/truck-icon.svg';
import AppText from '../../theme/AppText';

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
       <StatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Truck_Icon width={100} height={100} />
          </View>

          {/* Title */}
          <AppText style={styles.title}>Welcome Aboard!</AppText>

          {/* Subtitle */}
          <AppText style={styles.subtitle}>
          Let’s create your company profile.
          </AppText>

          {/* Steps Card */}
          <View style={styles.card}>
            <View style={styles.stepRow}>
              <AppText style={styles.check}>✓</AppText>
              <View>
                <AppText style={styles.stepTitle}>Upload Required Documents</AppText>
                <AppText style={styles.stepSub}>
                  Commercial Liability Insurance
                </AppText>
              </View>
            </View>

            <View style={styles.stepRow}>
              <AppText style={styles.check}>✓</AppText>
              <View>
                <AppText style={styles.stepTitle}>Add Vehicle Information</AppText>
                <AppText style={styles.stepSub}>
                  Registration, permits, and photos
                </AppText>
              </View>
            </View>

            <View style={styles.stepRow}>
              <AppText style={styles.check}>✓</AppText>
              <View>
                <AppText style={styles.stepTitle}>Get Verified</AppText>
                <AppText style={styles.stepSub}>
                  Our team reviews in 24–48 hours
                </AppText>
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
          <AppText style={styles.footerText}>
            Takes about 10–15 minutes
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeHome;
