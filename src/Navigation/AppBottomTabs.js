import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {moderateScale} from 'react-native-size-matters';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import EarningsScreen from '../screens/EarningsScreen/EarningsScreen';
import ScheduleScreen from '../screens/ScheduleScreen/ScheduleScreen';
import BiddingScreen from '../screens/BiddingScreen/BiddingScreen';
import BiddingIcon from '../assets/svg_icon/Bidding.svg';
import HomeIcon from '../assets/svg_icon/Home.svg';
import EarningsIcon from '../assets/svg_icon/Earnings.svg';
import ScheduleIcon from '../assets/svg_icon/Schedule.svg';
import {colors} from '../theme/colors';
import {IS_TABLET, select} from '../utils/device';

const Tab = createBottomTabNavigator();

const ICON_SIZE = select({phone: moderateScale(24), tablet: moderateScale(28)});

const renderTabIcon = Icon => ({focused}) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Icon
      color={focused ? colors.navy : '#9A9CB8'}
      width={ICON_SIZE}
      height={ICON_SIZE}
    />
  </View>
);

export default function AppBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: '#9A9CB8',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopLeftRadius: moderateScale(18),
          borderTopRightRadius: moderateScale(18),
          borderTopWidth: 0,
          height: select({phone: moderateScale(66), tablet: moderateScale(76)}),
          paddingTop: moderateScale(8),
          paddingBottom: moderateScale(8),
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(12),
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: renderTabIcon(HomeIcon),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: renderTabIcon(EarningsIcon),
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: renderTabIcon(ScheduleIcon),
        }}
      />
      <Tab.Screen
        name="BiddingTab"
        component={BiddingScreen}
        options={{
          tabBarLabel: 'Bidding',
          tabBarIcon: renderTabIcon(BiddingIcon),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IS_TABLET ? moderateScale(15) : Platform.OS === 'ios' ? moderateScale(14) : moderateScale(12),
    paddingVertical:     moderateScale(5),
    borderRadius: moderateScale(24),
    backgroundColor: colors.navy,
  },
  iconWrapActive: {
    backgroundColor: colors.white,
  },
});
