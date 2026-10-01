import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import styles from './AvailableLoadsScreen.styles';
import AppText from '../../theme/AppText';
import type {RootStackScreenProps} from '../../types/navigation';
import type {AvailableLoad} from '../../types/navigation';

const loads = [
  {
    id: 'LD-1023',
    pallets: 12,
    weight: '8 Tons',
    pickup: 'Delhi Warehouse',
    drop: 'Jaipur Hub',
    notes: 'Handle with care',
    rate: '₹42 / km',
    rateValue: 42,
    distanceKm: 281,
    pickupTiming: 'Today, 10:30 AM',
    pickupTimeValue: 630,
  },
  {
    id: 'LD-1024',
    pallets: 6,
    weight: '4 Tons',
    pickup: 'Gurgaon',
    drop: 'Agra',
    notes: 'Fragile items',
    rate: '₹38 / km',
    rateValue: 38,
    distanceKm: 221,
    pickupTiming: 'Today, 2:00 PM',
    pickupTimeValue: 840,
  },
];

const AvailableLoadsScreen = ({navigation}: RootStackScreenProps<'AvailableLoadsScreen'>) => {
  const [filter, setFilter] = useState<string>('Distance');

  const handlePlaceBid = (load: AvailableLoad) => {
    navigation.navigate('PlaceBidScreen', { load });
  };

  const sortedLoads = [...loads].sort((a, b) => {
    if (filter === 'Rate') return b.rateValue - a.rateValue;
    if (filter === 'Pickup Timing') {
      return a.pickupTimeValue - b.pickupTimeValue;
    }
    return a.distanceKm - b.distanceKm;
  });

  const renderLoadCard = ({item}: {item: (typeof loads)[number]}) => (
    <View style={styles.loadCard}>
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <AppText style={styles.loadId}>{item.id}</AppText>
        <AppText style={styles.rate}>{item.rate}</AppText>
      </View>

      {/* DETAILS */}
      <AppText style={styles.detailText}>
        📦 {item.pallets} Pallets • ⚖ {item.weight}
      </AppText>

      <AppText style={styles.locationText}>
        📍 Pickup: {item.pickup}
      </AppText>
      <AppText style={styles.locationText}>
        ⏱ Pickup Timing: {item.pickupTiming}
      </AppText>
      <AppText style={styles.locationText}>
        🏁 Drop: {item.drop}
      </AppText>

      <AppText style={styles.notes}>
        📝 {item.notes}
      </AppText>

      {/* ACTION */}
      <TouchableOpacity
        style={styles.bidButton}
        onPress={() => handlePlaceBid(item)}
      >
        <Text style={styles.bidText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        {['Distance', 'Rate', 'Pickup Timing'].map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              filter === item && styles.filterActive,
            ]}
            onPress={() => setFilter(item)}
          >
            <AppText
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* LOAD LIST */}
      <FlatList
        data={sortedLoads}
        renderItem={renderLoadCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      {/* MAP BUTTON */}
      <TouchableOpacity style={styles.mapButton}>
        <AppText style={styles.mapButtonText}>View on Map</AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AvailableLoadsScreen;
