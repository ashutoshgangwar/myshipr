import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import GPS_Icon from '../../../assets/svg_icon/gps-svg.svg';

// Source + destination autocomplete panel. Purely presentational — all state and
// handlers live in the RadarMapScreen container.
export default function SearchPanel({
  srcQuery,
  dstQuery,
  srcCoord,
  dstCoord,
  srcResults,
  dstResults,
  activeField,
  searching,
  searchError,
  locating,
  onChangeQuery,
  onFocusField,
  onSelectPlace,
  onLocate,
}) {
  const results = activeField === 'src' ? srcResults : dstResults;

  return (
    <View style={styles.searchPanel}>
      <View style={styles.inputRow}>
        <View style={[styles.fieldDot, {backgroundColor: '#2ecc71'}]} />
        <TextInput
          style={styles.input}
          placeholder="Search source"
          placeholderTextColor="#999"
          value={srcQuery}
          onChangeText={t => onChangeQuery('src', t)}
          onFocus={() => onFocusField('src')}
          returnKeyType="search"
        />
        {srcCoord ? <AppText style={styles.checkMark}>✓</AppText> : null}
        <TouchableOpacity
          style={styles.locateButton}
          onPress={onLocate}
          disabled={locating}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          activeOpacity={0.7}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.button_color} />
          ) : (
            <GPS_Icon width={20} headers={10} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.inputRow}>
        <View style={[styles.fieldDot, {backgroundColor: '#e74c3c'}]} />
        <TextInput
          style={styles.input}
          placeholder="Search destination"
          placeholderTextColor="#999"
          value={dstQuery}
          onChangeText={t => onChangeQuery('dst', t)}
          onFocus={() => onFocusField('dst')}
          returnKeyType="search"
        />
        {dstCoord ? <AppText style={styles.checkMark}>✓</AppText> : null}
      </View>

      {activeField && results.length ? (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {results.map((item, i) => (
              <TouchableOpacity
                key={`${item.formattedAddress}-${i}`}
                style={styles.resultRow}
                onPress={() => onSelectPlace(activeField, item)}
                activeOpacity={0.7}>
                <AppText style={styles.resultTitle} numberOfLines={1}>
                  {item.placeLabel || item.street || item.formattedAddress}
                </AppText>
                <AppText style={styles.resultSub} numberOfLines={1}>
                  {item.formattedAddress}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {searching && activeField ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={colors.button_color} />
        </View>
      ) : null}

      {!searching && activeField && searchError && !results.length ? (
        <View style={styles.searchingRow}>
          <AppText style={styles.errorText} numberOfLines={2}>
            {searchError}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchPanel: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  fieldDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.text_dark,
    padding: 0,
  },
  checkMark: {
    color: '#2ecc71',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginLeft: moderateScale(6),
  },
  locateButton: {
    marginLeft: moderateScale(8),
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning_text,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: moderateScale(19),
  },
  dropdown: {
    maxHeight: verticalScale(180),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: verticalScale(4),
  },
  resultRow: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  resultTitle: {
    fontSize: moderateScale(14),
    color: colors.text_dark,
    fontWeight: '600',
  },
  resultSub: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: verticalScale(1),
  },
  searchingRow: {
    paddingVertical: verticalScale(8),
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
});
