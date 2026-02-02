import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import styles from './OCRScanCard.styles';


const OCRScanCard = ({
  title,
  image,
  placeholderImage,
  onScan,
  status = 'pending',
  children,
}) => {
  const isCompleted = status === 'completed';

  const imageUri =
    image?.uri ||
    image?.path ||
    (Array.isArray(image?.assets) ? image.assets[0]?.uri : null);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View
          style={[
            styles.statusBadge,
            isCompleted ? styles.badgeSuccess : styles.badgePending,
          ]}>
          <Text style={styles.badgeText}>
            {isCompleted ? 'Completed' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Scan Area */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.scanArea}
        onPress={onScan}
        disabled={!onScan}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.cardImage} />
        ) : (
          <>
            <Image source={placeholderImage} style={styles.placeholderImage} />
            <Text style={styles.scanText}>Tap to scan document</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Extracted Fields */}
      {children && <View style={styles.cardChildren}>{children}</View>}
    </View>
  );
};

export default OCRScanCard;
