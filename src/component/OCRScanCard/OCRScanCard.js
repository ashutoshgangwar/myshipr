import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './OCRScanCard.styles';
import ActionButton from '../ActionButton/ActionButton';

const OCRScanCard = ({ title, image, onScan, placeholderImage, children }) => {
  return (
    <View style={styles.card}>
      {/* Title */}
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
          {placeholderImage && (
            <Image
              source={placeholderImage} // now dynamic
              style={styles.placeholderImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.placeholderText}>Scan your document</Text>
        </View>
      ) : null}

      {/* Scan Button */}
      {onScan && (
        <ActionButton
          title={image ? 'Rescan Document' : 'Scan Document'}
          onPress={onScan}
          bgColor="#0B5ED7"
          textColor="#fff"
        />
      )}

      {/* Optional children */}
      {children && <View style={styles.cardChildren}>{children}</View>}
    </View>
  );
};

export default OCRScanCard;
