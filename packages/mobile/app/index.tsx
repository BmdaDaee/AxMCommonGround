// packages/mobile/app/index.tsx
// Root redirect — checks auth and pair status, routes accordingly
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { isAuthenticated } from '../src/lib/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    isAuthenticated().then((authed) => {
      if (authed) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#D4AF37" />
    </View>
  );
}
