import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CoinBadge from './components/CoinBadge';
import styles from './CoinTestScreen.styles';
import type {RootStackScreenProps} from '../../types/navigation';

/** One selectable coin, as the mock backend returns it. */
interface CoinOption {
  id?: string;
  value: number;
}

/**
 * Pretends to be the backend: resolves after ~800ms with a list of coin
 * denominations. Swap the body for a real `fetch(...)` / API call — the shape
 * ({id, value}) is all the screen needs.
 */
function fetchCoinOptions() {
  return new Promise(resolve => {
    setTimeout(() => {
      const values = [10, 12, 23, 50, 100, 250, 500, 1000];
      resolve(values.map((value, i) => ({id: `coin_${i}`, value})));
    }, 800);
  });
}

/**
 * Pretends to POST the selected coin to the backend.
 */
function submitCoin(_coin: CoinOption) {
  return new Promise(resolve => setTimeout(() => resolve(true), 600));
}

export default function CoinTestScreen({navigation}: RootStackScreenProps<'CoinTestScreen'>) {
  const [coins, setCoins] = useState<CoinOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null | undefined>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load the coin values from the "backend" on mount.
  useEffect(() => {
    let alive = true;
    fetchCoinOptions().then(data => {
      if (!alive) return;
      setCoins(data as CoinOption[]);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const selectedCoin = coins.find(c => c.id === selectedId) || null;

  const handleSubmit = useCallback(async () => {
    if (!selectedCoin) return;
    setSubmitting(true);
    // Only the selected value is sent to the backend.
    await submitCoin({value: selectedCoin.value});
    setSubmitting(false);
    Alert.alert('Submitted', `Sent coin value ${selectedCoin.value} to the backend.`);
  }, [selectedCoin]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {!!navigation && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <AppText style={styles.backGlyph}>‹</AppText>
          </TouchableOpacity>
        )}
        <AppText style={styles.title}>Select a Coin</AppText>
      </View>

      <AppText style={styles.subtitle}>
        Values come from the backend. Tap a coin to select it, then submit.
      </AppText>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy} />
          <AppText style={styles.loadingText}>Loading coins…</AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {coins.map(coin => (
            <TouchableOpacity
              key={coin.id}
              style={styles.coinCell}
              activeOpacity={0.8}
              onPress={() => setSelectedId(coin.id)}>
              <CoinBadge value={coin.value} selected={coin.id === selectedId} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <AppText style={styles.selectedLabel}>
          {selectedCoin
            ? `Selected: ${selectedCoin.value}`
            : 'No coin selected'}
        </AppText>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!selectedCoin || submitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedCoin || submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <AppText style={styles.submitText}>Submit</AppText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
