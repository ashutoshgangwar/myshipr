import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'delivery:';

export const saveDeliveryConfirmation = async (
  loadId: string,
  payload: unknown,
): Promise<boolean> => {
  try {
    const key = `${KEY_PREFIX}${loadId}`;
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.log('DeliveryService.save error', e);
    throw e;
  }
};

export const getDeliveryConfirmation = async (
  loadId: string,
): Promise<unknown> => {
  try {
    const key = `${KEY_PREFIX}${loadId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('DeliveryService.get error', e);
    return null;
  }
};

export default {
  saveDeliveryConfirmation,
  getDeliveryConfirmation,
};
