import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import styles from './AvailableLoadsScreen.styles';

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

const AvailableLoadsScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('Distance');

  const handlePlaceBid = load => {
    navigation.navigate('PlaceBidScreen', { load });
  };

  const sortedLoads = [...loads].sort((a, b) => {
    if (filter === 'Rate') return b.rateValue - a.rateValue;
    if (filter === 'Pickup Timing') {
      return a.pickupTimeValue - b.pickupTimeValue;
    }
    return a.distanceKm - b.distanceKm;
  });

  const renderLoadCard = ({ item }) => (
    <View style={styles.loadCard}>
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <Text style={styles.loadId}>{item.id}</Text>
        <Text style={styles.rate}>{item.rate}</Text>
      </View>

      {/* DETAILS */}
      <Text style={styles.detailText}>
        📦 {item.pallets} Pallets • ⚖ {item.weight}
      </Text>

      <Text style={styles.locationText}>
        📍 Pickup: {item.pickup}
      </Text>
      <Text style={styles.locationText}>
        ⏱ Pickup Timing: {item.pickupTiming}
      </Text>
      <Text style={styles.locationText}>
        🏁 Drop: {item.drop}
      </Text>

      <Text style={styles.notes}>
        📝 {item.notes}
      </Text>

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
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
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
        <Text style={styles.mapButtonText}>View on Map</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AvailableLoadsScreen;
