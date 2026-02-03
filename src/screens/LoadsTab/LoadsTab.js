import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import styles from './LoadsTab.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { key: 'available', label: 'Available' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const LOADS = [
  {
    id: 'SH-301',
    status: 'available',
    weight: '8,500 lbs',
    miles: '239 miles',
    from: 'Dallas, TX',
    to: 'Houston, TX',
    date: 'Feb 5',
    pay: '$650',
  },
  {
    id: 'SH-302',
    status: 'active',
    weight: '15,000 lbs',
    miles: '662 miles',
    from: 'Miami, FL',
    to: 'Atlanta, GA',
    date: 'Feb 6',
    pay: '$1,200',
  },
  {
    id: 'SH-303',
    status: 'completed',
    weight: '6,200 lbs',
    miles: '215 miles',
    from: 'New York, NY',
    to: 'Boston, MA',
    date: 'Feb 7',
    pay: '$580',
  },
];

const LoadsTab = () => {
  const [activeTab, setActiveTab] = useState('available');

  const filteredLoads = useMemo(
    () => LOADS.filter(load => load.status === activeTab),
    [activeTab]
  );

  const getStatusStyle = status => {
    if (status === 'available') return styles.statusAvailable;
    if (status === 'active') return styles.statusActive;
    return styles.statusCompleted;
  };

  const renderLoadCard = ({ item }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.loadId}>Load #{item.id}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.subText}>
        {item.weight} • {item.miles}
      </Text>

      {/* Locations */}
      <View style={styles.locationRow}>
        <Text style={styles.location}>🟢 {item.from}</Text>
        <Text style={styles.location}>🔴 {item.to}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.estimate}>Estimated Pay</Text>
          <Text style={styles.pay}>{item.pay}</Text>
        </View>

        {item.status === 'available' && (
          <TouchableOpacity style={styles.bidButton}>
            <Text style={styles.bidText}>Place Bid</Text>
          </TouchableOpacity>
        )}

        {item.status === 'active' && (
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackText}>Track</Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <Text style={styles.completedText}>Completed</Text>
        )}
      </View>
    </View>
  );

  return (
      <SafeAreaView style={styles.safe}>
          <StatusBar
            backgroundColor={colors.primary}
            barStyle="dark-content"
            translucent={false}
          />
    <View style={styles.container}>
      <Text style={styles.title}>Loads</Text>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const count = LOADS.filter(l => l.status === tab.key).length;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filteredLoads}
        keyExtractor={item => item.id}
        renderItem={renderLoadCard}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No loads found</Text>
        }
      />
    </View>
    </SafeAreaView>
  );
};

export default LoadsTab;
