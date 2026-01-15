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
  },
  {
    id: 'LD-1024',
    pallets: 6,
    weight: '4 Tons',
    pickup: 'Gurgaon',
    drop: 'Agra',
    notes: 'Fragile items',
    rate: '₹38 / km',
  },
];

const AvailableLoadsScreen = () => {
  const [filter, setFilter] = useState('Distance');

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
        🏁 Drop: {item.drop}
      </Text>

      <Text style={styles.notes}>
        📝 {item.notes}
      </Text>

      {/* ACTION */}
      <TouchableOpacity style={styles.bidButton}>
        <Text style={styles.bidText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        {['Distance', 'Rate', 'Pickup Time'].map(item => (
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
        data={loads}
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
