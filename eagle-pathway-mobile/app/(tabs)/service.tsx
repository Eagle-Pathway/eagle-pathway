import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ServiceTab() {
  useEffect(() => {
    router.push('/service-request');
  }, []);

  return null;
}
