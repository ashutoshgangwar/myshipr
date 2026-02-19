import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import styles from './PlaceBidScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';

const PlaceBidScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const load = route?.params?.load || {};

  const lowestBid = useMemo(() => {
    if (!load.bids || load.bids.length === 0) return null;
    return Math.min(...load.bids.map(bid => bid.amount));
  }, [load.bids]);

  const suggestedBid = useMemo(() => {
    if (!lowestBid) return null;
    return Math.max(lowestBid - 50, 0);
  }, [lowestBid]);

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
       <StatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Place Bid</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContentContainer}
        >
        {/* Load Details Card */}
        <View style={styles.heroCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.loadBadge}>
              <Text style={styles.loadBadgeText}>LOAD</Text>
            </View>
            <Text style={styles.loadIdHero}>#{load.id || 'N/A'}</Text>
          </View>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.greenDot} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeLocation}>{load.from}</Text>
              </View>
            </View>
            
            <View style={styles.routePoint}>
              <View style={styles.redDot} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>DELIVERY</Text>
                <Text style={styles.routeLocation}>{load.to}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{load.weight}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{load.miles}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Est. Pay</Text>
              <Text style={styles.statValueGreen}>{load.pay}</Text>
            </View>
          </View>
        </View>

        {/* Live Bidding Section */}
        {load.bids && load.bids.length > 0 && (
          <View style={styles.biddingCard}>
            <View style={styles.biddingHeader}>
              <Text style={styles.liveBadge}>🔴 LIVE</Text>
              <Text style={styles.biddingTitle}>Active Bidding</Text>
              <Text style={styles.bidCount}>{load.bids.length} bids</Text>
            </View>

            <View style={styles.winningBidCard}>
              <View style={styles.winningBidHeader}>
                <Text style={styles.winningBidLabel}>🏆 CURRENT LOWEST</Text>
                <View style={styles.trendingDown}>
                  <Text style={styles.trendingText}>↓ Trending Down</Text>
                </View>
              </View>
              <Text style={styles.winningBidAmount}>${lowestBid}</Text>
              <Text style={styles.winningBidSubtext}>Beat this to win the load</Text>
            </View>
            
            <View style={styles.bidsListContainer}>
              <Text style={styles.recentBidsTitle}>Recent Bids</Text>
              {load.bids.slice(0, 3).map((bid, index) => (
                <View key={index} style={[
                  styles.bidItemCard,
                  index === 0 && styles.topBidItem
                ]}>
                  <View style={styles.bidItemLeft}>
                    <View style={[styles.bidRank, index === 0 && styles.topRank]}>
                      <Text style={[styles.bidRankText, index === 0 && styles.topRankText]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.bidderNameNew}>{bid.bidder}</Text>
                      <Text style={styles.bidTimeNew}>{bid.time}</Text>
                    </View>
                  </View>
                  <View style={styles.bidAmountContainer}>
                    <Text style={[styles.bidAmountNew, index === 0 && styles.topBidAmount]}>
                      ${bid.amount}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Place Your Bid Section */}
        <View style={styles.placeBidCard}>
          <View style={styles.placeBidHeader}>
            <Text style={styles.placeBidTitle}>💰 Place Your Bid</Text>
            <Text style={styles.placeBidSubtitle}>Competitive pricing wins</Text>
          </View>

          {/* Quick Bid Suggestions */}
          {suggestedBid && (
            <View style={styles.quickBidsContainer}>
              <Text style={styles.quickBidsLabel}>Quick Bid</Text>
              <View style={styles.quickBidsRow}>
                <TouchableOpacity 
                  style={styles.quickBidChip}
                  onPress={() => setAmount(String(suggestedBid))}
                >
                  <Text style={styles.quickBidAmount}>${suggestedBid}</Text>
                  <Text style={styles.quickBidLabel}>Suggested</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickBidChip}
                  onPress={() => setAmount(String(lowestBid - 25))}
                >
                  <Text style={styles.quickBidAmount}>${lowestBid - 25}</Text>
                  <Text style={styles.quickBidLabel}>Competitive</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bid Input */}
          <View style={styles.bidInputSection}>
            <Text style={styles.bidInputLabel}>Enter Your Bid</Text>
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[
                styles.bidInputContainer,
                isFocused && styles.bidInputFocused
              ]}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  ref={inputRef}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={styles.bidInput}
                />
                <Text style={styles.usdText}>USD</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* Bid Validation Message */}
          {amount && lowestBid && parseFloat(amount) >= lowestBid && (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Bid must be lower than ${lowestBid} to be competitive
              </Text>
            </View>
          )}
          
          {amount && lowestBid && parseFloat(amount) < lowestBid && (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>
                Great! Your bid is ${(lowestBid - parseFloat(amount)).toFixed(0)} lower
              </Text>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              📋 Final amount subject to adjustment post-delivery
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!amount || (lowestBid && parseFloat(amount) >= lowestBid)) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>🚀 Submit Bid & Win Load</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PlaceBidScreen;
