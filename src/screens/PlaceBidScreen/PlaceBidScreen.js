import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import styles from './PlaceBidScreen.styles';

const PlaceBidScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const load = route?.params?.load || {};

  const handleSubmit = () => {
    const formattedAmount = String(amount || '').trim();
    if (!formattedAmount) return;

    Alert.alert('Bid Submitted', `Approximate amount: ₹${formattedAmount}`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Place Bid</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.loadId}>{load.id || 'Load'}</Text>
        {load.route ? <Text style={styles.route}>{load.route}</Text> : null}
        {load.estimatedPay ? (
          <Text style={styles.estimatedPay}>Estimated Pay: {load.estimatedPay}</Text>
        ) : null}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Approximate Amount</Text>
        <TextInput
          placeholder="₹ Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />
        <Text style={styles.note}>
          ⚠ This is an approximate amount. Final amount may change after delivery.
        </Text>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Bid</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PlaceBidScreen;
