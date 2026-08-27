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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import styles from './PlaceBidScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import CoinsAnimation from '../../component/CoinsAnimation/CoinsAnimation';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';
import type {RootStackScreenProps} from '../../types/navigation';

const PlaceBidScreen = ({navigation, route}: RootStackScreenProps<'PlaceBidScreen'>) => {
  const [amount, setAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showCoinsAnimation, setShowCoinsAnimation] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const load = route?.params?.load || {};

  const lowestBid = useMemo(() => {
    if (!load.bids || load.bids.length === 0) return null;
    return Math.min(
      ...load.bids.map((bid: {amount?: number}) => bid.amount ?? Infinity),
    );
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

    // Trigger coins animation
    setShowCoinsAnimation(true);
    
    // Show success alert immediately
    Alert.alert('Bid Submitted', `Your bid of $${bidAmount} has been submitted successfully!`);
    
    // Wait for animation to complete (6000ms) before resetting and navigating back
    setTimeout(() => {
      setShowCoinsAnimation(false);
      navigation.goBack();
    }, 6000);
  };

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />
      <CoinsAnimation isActive={showCoinsAnimation} amount={parseFloat(amount) || 0} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={styles.backText}>Back</AppText>
        </TouchableOpacity>
        <AppText style={styles.title}>Place Bid</AppText>
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
              <AppText style={styles.loadBadgeText}>LOAD</AppText>
            </View>
            <AppText style={styles.loadIdHero}>#{load.id || 'N/A'}</AppText>
          </View>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.greenDot} />
              <View style={styles.routeTextContainer}>
                <AppText style={styles.routeLabel}>PICKUP</AppText>
                <AppText style={styles.routeLocation}>{load.from}</AppText>
              </View>
            </View>
            
            <View style={styles.routePoint}>
              <View style={styles.redDot} />
              <View style={styles.routeTextContainer}>
                <AppText style={styles.routeLabel}>DELIVERY</AppText>
                <AppText style={styles.routeLocation}>{load.to}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Weight</AppText>
              <AppText style={styles.statValue}>{load.weight}</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Distance</AppText>
              <AppText style={styles.statValue}>{load.miles}</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Est. Pay</AppText>
              <AppText style={styles.statValueGreen}>{load.pay}</AppText>
            </View>
          </View>
        </View>

        {/* Live Bidding Section */}
        {load.bids && load.bids.length > 0 && (
          <View style={styles.biddingCard}>
            <View style={styles.biddingHeader}>
              <AppText style={styles.liveBadge}>🔴 LIVE</AppText>
              <AppText style={styles.biddingTitle}>Active Bidding</AppText>
              <AppText style={styles.bidCount}>{load.bids.length} bids</AppText>
            </View>

            <View style={styles.winningBidCard}>
              <View style={styles.winningBidHeader}>
                <AppText style={styles.winningBidLabel}>🏆 CURRENT LOWEST</AppText>
                <View style={styles.trendingDown}>
                  <AppText style={styles.trendingText}>↓ Trending Down</AppText>
                </View>
              </View>
              <AppText style={styles.winningBidAmount}>${lowestBid}</AppText>
              <AppText style={styles.winningBidSubtext}>Beat this to win the load</AppText>
            </View>
            
            <View style={styles.bidsListContainer}>
              <AppText style={styles.recentBidsTitle}>Recent Bids</AppText>
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
                      <AppText style={styles.bidderNameNew}>{bid.bidder}</AppText>
                      <AppText style={styles.bidTimeNew}>{bid.time}</AppText>
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
            <AppText style={styles.placeBidTitle}>💰 Place Your Bid</AppText>
            <AppText style={styles.placeBidSubtitle}>Competitive pricing wins</AppText>
          </View>

          {/* Quick Bid Suggestions */}
          {suggestedBid && (
            <View style={styles.quickBidsContainer}>
              <AppText style={styles.quickBidsLabel}>Quick Bid</AppText>
              <View style={styles.quickBidsRow}>
                <TouchableOpacity 
                  style={styles.quickBidChip}
                  onPress={() => setAmount(String(suggestedBid))}
                >
                  <AppText style={styles.quickBidAmount}>${suggestedBid}</AppText>
                  <AppText style={styles.quickBidLabel}>Suggested</AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickBidChip}
                  onPress={() => setAmount(String(lowestBid! - 25))}
                >
                  <AppText style={styles.quickBidAmount}>${lowestBid! - 25}</AppText>
                  <AppText style={styles.quickBidLabel}>Competitive</AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bid Input */}
          <View style={styles.bidInputSection}>
            <AppText style={styles.bidInputLabel}>Enter Your Bid</AppText>
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[
                styles.bidInputContainer,
                isFocused && styles.bidInputFocused
              ]}>
                <AppText style={styles.dollarSign}>$</AppText>
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
                <AppText style={styles.usdText}>USD</AppText>
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* Bid Validation Message */}
          {amount && lowestBid && parseFloat(amount) >= lowestBid && (
            <View style={styles.warningBox}>
              <AppText style={styles.warningIcon}>⚠️</AppText>
              <AppText style={styles.warningText}>
                Bid must be lower than ${lowestBid} to be competitive
              </AppText>
            </View>
          )}
          
          {amount && lowestBid && parseFloat(amount) < lowestBid && (
            <View style={styles.successBox}>
              <AppText style={styles.successIcon}>✓</AppText>
              <AppText style={styles.successText}>
                Great! Your bid is ${(lowestBid - parseFloat(amount)).toFixed(0)} lower
              </AppText>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <AppText style={styles.disclaimerText}>
              📋 Final amount subject to adjustment post-delivery
            </AppText>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!amount ||
                Boolean(lowestBid && parseFloat(amount) >= lowestBid)) &&
                styles.submitButtonDisabled,
            ]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <AppText style={styles.submitButtonText}>🚀 Submit Bid & Win Load</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PlaceBidScreen;
