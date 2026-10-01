import React from 'react';
import {View, Image, TouchableOpacity} from 'react-native';
import styles from './OCRScanCard.styles';
import AppText from '../../theme/AppText';
import type {ImageSourcePropType} from 'react-native';


export interface OCRScanCardProps {
  title?: string;
  /** A picked asset, a picker response, or anything carrying a uri/path. */
  image?: {uri?: string; path?: string; assets?: Array<{uri?: string}>} | null;
  placeholderImage?: ImageSourcePropType;
  onScan?: () => void;
  status?: 'pending' | 'completed';
  children?: React.ReactNode;
}

const OCRScanCard = ({
  title,
  image,
  placeholderImage,
  onScan,
  status = 'pending',
  children,
}: OCRScanCardProps) => {
  const isCompleted = status === 'completed';

  const imageUri =
    image?.uri ||
    image?.path ||
    (Array.isArray(image?.assets) ? image.assets[0]?.uri : null);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.cardTitle}>{title}</AppText>
        <View
          style={[
            styles.statusBadge,
            isCompleted ? styles.badgeSuccess : styles.badgePending,
          ]}>
          <AppText style={styles.badgeText}>
            {isCompleted ? 'Completed' : 'Pending'}
          </AppText>
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
            <AppText style={styles.scanText}>Tap to scan document</AppText>
          </>
        )}
      </TouchableOpacity>

      {/* Extracted Fields */}
      {children && <View style={styles.cardChildren}>{children}</View>}
    </View>
  );
};

export default OCRScanCard;
