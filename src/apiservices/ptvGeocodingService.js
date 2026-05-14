import axios from 'axios';
import {PTV_API_KEY} from '@env';

const PTV_API_BASE_URL = 'https://api.myptv.com/geocoding/v1';
const API_KEY = (PTV_API_KEY || '').trim();

const ptvClient = axios.create({
  baseURL: PTV_API_BASE_URL,
  timeout: 15000,
});

const buildAuthConfig = params => {
  if (!API_KEY) {
    throw new Error('PTV_API_KEY is missing. Please set it in .env and rebuild the app.');
  }

  return {
    params: {
      ...params,
      // keep query param for compatibility
      apiKey: API_KEY,
    },
    headers: {
      ApiKey: API_KEY,
    },
  };
};

/**
 * Search for locations by text
 * @param {string} searchText - The text to search for (e.g., address)
 * @param {string} countryFilter - Comma-separated country codes (e.g., 'IT,NL,DE,BE')
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} Response with locations array
 */
export const searchLocationsByText = async (
  searchText,
  countryFilter = 'NL,IT,DE,BE',
  language = 'en',
) => {
  try {
    const params = {
      searchText,
      countryFilter,
      language,
    };

    const response = await ptvClient.get(
      '/locations/by-text',
      buildAuthConfig(params),
    );

    return response.data;
  } catch (error) {
    const statusCode = error?.response?.status;
    if (statusCode === 401) {
      console.error('PTV geocoding unauthorized (401). Check PTV_API_KEY in .env.');
    } else {
      console.error('Error searching locations:', error?.message || error);
    }
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} Response with location details
 */
export const reverseGeocode = async (latitude, longitude, language = 'en') => {
  try {
    const params = {
      latitude,
      longitude,
      language,
    };

    const response = await ptvClient.get(
      '/locations/by-position',
      buildAuthConfig(params),
    );

    return response.data;
  } catch (error) {
    const statusCode = error?.response?.status;
    if (statusCode === 401) {
      console.error('PTV reverse geocoding unauthorized (401). Check PTV_API_KEY in .env.');
    } else {
      console.error('Error reverse geocoding:', error?.message || error);
    }
    throw error;
  }
};

/**
 * Extract coordinates from search response
 * @param {Object} location - Location object from API response
 * @returns {Object} Object with latitude and longitude
 */
export const extractCoordinates = (location) => {
  if (location?.referencePosition) {
    return {
      latitude: location.referencePosition.latitude,
      longitude: location.referencePosition.longitude,
    };
  }
  return null;
};

/**
 * Format address from API response
 * @param {Object} location - Location object from API response
 * @returns {string} Formatted address string
 */
export const formatAddress = (location) => {
  if (location?.formattedAddress) {
    return location.formattedAddress;
  }
  const addr = location?.address;
  if (addr) {
    return `${addr.street} ${addr.houseNumber}, ${addr.postalCode} ${addr.city} ${addr.countryName}`.trim();
  }
  return '';
};
