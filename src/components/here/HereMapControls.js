import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {HERE_LANGUAGE_CODES, HERE_MAP_STYLES} from '../../types/hereMap';

const HereMapControls = ({style, setStyle, lang, setLang}) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Styles</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {HERE_MAP_STYLES.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setStyle?.(item)}
            style={[styles.pill, style === item && styles.pillActive]}>
            <Text style={[styles.pillText, style === item && styles.pillTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.title}>Language</Text>
      <View style={styles.row}>
        {HERE_LANGUAGE_CODES.map(code => (
          <TouchableOpacity
            key={code}
            onPress={() => setLang?.(code)}
            style={[styles.pill, lang === code && styles.pillActive]}>
            <Text style={[styles.pillText, lang === code && styles.pillTextActive]}>
              {code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {gap: 10},
  title: {fontWeight: '700', color: '#334155'},
  row: {flexDirection: 'row'},
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  pillActive: {borderColor: '#2563EB', backgroundColor: '#DBEAFE'},
  pillText: {fontSize: 11, color: '#334155', fontWeight: '600'},
  pillTextActive: {color: '#1D4ED8'},
});

export default HereMapControls;
