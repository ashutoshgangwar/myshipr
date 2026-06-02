import React, {useRef, useState} from 'react';
import {SafeAreaView, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import HereSearchCard from './hereSearchCard';

export default function HereSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const sourceRef = useRef(null);
  const destinationRef = useRef(null);

  const [activeInput, setActiveInput] = useState('destination');
  const [sourceLocation, setSourceLocation] = useState(route.params?.sourceLocation || null);
  const [destinationLocation, setDestinationLocation] = useState(route.params?.destinationLocation || null);
  const [sourceText, setSourceText] = useState(route.params?.sourceText || '');
  const [destinationText, setDestinationText] = useState(route.params?.destinationText || '');

  const handleDestinationSelected = location => {
    setDestinationLocation(location);
    setDestinationText(location.description || '');
    navigation.replace('HereMapScreen', {
      sourceLocation,
      sourceText,
      destinationLocation: location,
      destinationText: location.description || '',
    });
  };

  const handleSourceSelected = location => {
    setSourceLocation(location);
    setSourceText(location.description || '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search location</Text>
      </View>

      <HereSearchCard
        sourceRef={sourceRef}
        destinationRef={destinationRef}
        activeInput={activeInput}
        onActiveInputChange={setActiveInput}
        sourceLocation={sourceLocation}
        destinationLocation={destinationLocation}
        sourceText={sourceText}
        destinationText={destinationText}
        setSourceLocation={setSourceLocation}
        setDestinationLocation={setDestinationLocation}
        setSourceText={setSourceText}
        setDestinationText={setDestinationText}
        onCoordinateSelect={() => {}}
        onSourceSelected={handleSourceSelected}
        onDestinationSelected={handleDestinationSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f172a',
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  backButtonText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
});
