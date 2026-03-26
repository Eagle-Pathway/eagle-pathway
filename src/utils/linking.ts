import { Linking, Alert } from 'react-native';

export const openWhatsApp = async (phone: string, message: string = 'Hello!') => {
  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Format should be: country code + number without leading zeros
  // e.g., +251 911 111 111 -> 251911111111
  
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web URL if WhatsApp app is not installed
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
  }
};
