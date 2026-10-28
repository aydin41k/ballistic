import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { isReady, isAuthenticated } = useAuth();
  if (!isReady) return <LoadingScreen />;
  return <Redirect href={isAuthenticated ? '/journal' : '/login'} />;
}
