import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import styles from './PlaceBidScreen.styles';

const PlaceBidScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const load = route?.params?.load || {};

  const lowestBid = useMemo(() => {
    if (!load.bids || load.bids.length === 0) return null;
    return Math.min(...load.bids.map(bid => bid.amount));
  }, [load.bids]);

  const handleSubmit = () => {
    const bidAmount = parseFloat(amount);
    
    if (!amount || isNaN(bidAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid bid amount.');
      return;
    }

    if (lowestBid && bidAmount >= lowestBid) {
      Alert.alert(
        'Bid Too High',
        `Your bid must be lower than the current lowest bid of $${lowestBid}. Please enter a lower amount.`
      );
      return;
    }

    Alert.alert('Bid Submitted', `Your bid of $${bidAmount} has been submitted successfully!`);
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

      <ScrollView style={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.loadId}>Load #{load.id || 'N/A'}</Text>
          <Text style={styles.subText}>
            {load.weight} • {load.miles}
          </Text>
          <View style={styles.locationInfo}>
            <Text style={styles.location}>🟢 {load.from}</Text>
            <Text style={styles.location}>🔴 {load.to}</Text>
          </View>
          <Text style={styles.estimatedPay}>Estimated Pay: {load.pay}</Text>
        </View>

        {/* Current Bids Section */}
        {load.bids && load.bids.length > 0 && (
          <View style={styles.bidsCard}>
            <Text style={styles.sectionTitle}>Current Bids</Text>
            <View style={styles.lowestBidHighlight}>
              <Text style={styles.lowestBidLabel}>Lowest Bid</Text>
              <Text style={styles.lowestBidAmount}>${lowestBid}</Text>
            </View>
            
            <View style={styles.bidsList}>
              {load.bids.map((bid, index) => (
                <View key={index} style={styles.bidItem}>
                  <View>
                    <Text style={styles.bidderName}>{bid.bidder}</Text>
                    <Text style={styles.bidTime}>{bid.time}</Text>
                  </View>
                  <Text style={styles.bidAmount}>${bid.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Place Bid Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Your Bid Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              selectTextOnFocus={true}
            />
          </View>
          
          {lowestBid && (
            <Text style={styles.bidHint}>
              💡 Your bid must be lower than ${lowestBid}
            </Text>
          )}
          
          <Text style={styles.note}>
            ⚠️ This is an approximate amount. Final amount may be adjusted after delivery confirmation.
          </Text>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Bid</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlaceBidScreen;
