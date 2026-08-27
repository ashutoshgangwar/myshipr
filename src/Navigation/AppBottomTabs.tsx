import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from 'react-native-size-matters';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import EarningsScreen from '../screens/EarningsScreen/EarningsScreen';
import ShipmentScreen from '../screens/ShipmentScreen/ShipmentScreen';
import BiddingScreen from '../screens/BiddingScreen/BiddingScreen';
import BiddingIcon from '../assets/svg_icon/Bidding.svg';
import HomeIcon from '../assets/svg_icon/Home.svg';
import EarningsIcon from '../assets/svg_icon/Earnings.svg';
import ScheduleIcon from '../assets/svg_icon/Schedule.svg';
import SettingsIcon from '../assets/svg_icon/Settings_Tab.svg';
import useDriverRole from '../hooks/useDriverRole';
import {colors} from '../theme/colors';
import {IS_TABLET, select} from '../theme/device';
import SalaryScreen from '../screens/SalaryScreen/SalaryScreen';
import Profile from '../screens/Profile/Profile';
import type {SvgProps} from 'react-native-svg';
import type {MainTabParamList, MainTabScreenProps} from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Profile doubles as the fleet driver's Settings tab; as a tab it has no screen
// beneath it, so the header back arrow is dropped.
const ProfileTab = (props: MainTabScreenProps<'SettingsTab'>) => (
  <Profile
    {...(props as unknown as React.ComponentProps<typeof Profile>)}
    showBack={false}
  />
);

const ICON_SIZE = select({phone: moderateScale(22), tablet: moderateScale(25)});

const renderTabIcon =
  (Icon: React.FC<SvgProps>) =>
  ({focused}: {focused: boolean}) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Icon
      color={focused ? colors.navy : '#9A9CB8'}
      width={ICON_SIZE}
      height={ICON_SIZE}
    />
  </View>
);

const TABS = {
  home: {name: 'HomeTab', component: HomeScreen, label: 'Home', icon: HomeIcon},
  earnings: {
    name: 'EarningsTab',
    component: EarningsScreen,
    label: 'Earnings',
    icon: EarningsIcon,
  },
  shipment: {
    name: 'ShipmentTab',
    component: ShipmentScreen,
    label: 'Shipment',
    icon: ScheduleIcon,
  },
  bidding: {
    name: 'BiddingTab',
    component: BiddingScreen,
    label: 'Bidding',
    icon: BiddingIcon,
  },
  salary: {
    name: 'SalaryTab',
    component: SalaryScreen,
    label: 'Salary',
    icon: EarningsIcon,
  },
  // Fleet drivers have no Account Settings entry in the Home dropdown — the
  // Settings tab is where they get to the profile screen instead.
  settings: {
    name: 'SettingsTab',
    component: ProfileTab,
    label: 'Settings',
    icon: SettingsIcon,
  },
};

const FLEET_TABS = [TABS.home, TABS.salary, TABS.settings];
const SINGLE_TABS = [TABS.home, TABS.earnings, TABS.shipment, TABS.bidding];

export default function AppBottomTabs() {
  const {isFleet} = useDriverRole();
  const tabs = isFleet ? FLEET_TABS : SINGLE_TABS;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, moderateScale(8));

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
          height: select({phone: moderateScale(60), tablet: moderateScale(64)}) + bottomInset,
          paddingTop: moderateScale(8),
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(12),
          fontWeight: '600',
        },
      }}>
      {/* The tab set is chosen at runtime from the driver's role, so each
          entry's `name` cannot be correlated with its own component type here —
          the pairs themselves are declared correctly in TABS above. */}
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name as keyof MainTabParamList}
          component={
            tab.component as unknown as React.ComponentType<
              Record<string, never>
            >
          }
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: renderTabIcon(tab.icon),
          }}
        />
      ))}
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
