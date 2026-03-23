import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { LoadingScreen } from '../src/components/common';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/(auth)/splash" />;
}
