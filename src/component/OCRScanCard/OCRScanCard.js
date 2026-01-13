import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './OCRScanCard.styles';
import ActionButton from '../ActionButton/ActionButton';

const OCRScanCard = ({ title, image, onScan, children }) => {
  return (
    <View style={styles.card}>
      {/* Title & Subtitle */}
      <View style={styles.header}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {/* Image Preview */}
      {image ? (
        <Image
          source={{ uri: image.uri }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : onScan ? (
        <View style={styles.cardPlaceholder}>
          <Image
            source={require('../../assets/Image/sample_CDL.jpg')}
            style={styles.placeholderImage}
            resizeMode="contain"
          />
          <Text style={styles.placeholderText}>Scanned your CDL</Text>
        </View>
      ) : null}

      {/* Scan Button only if onScan prop is passed */}
      {onScan && (
        <ActionButton
          title={image ? 'Rescan Document' : 'Scan Document'}
          onPress={onScan}
          bgColor="#0B5ED7"
          textColor="#fff"
        />
      )}

      {/* Optional children (InfoRow or other details) */}
      {children && <View style={styles.cardChildren}>{children}</View>}
    </View>
  );
};

export default OCRScanCard;
