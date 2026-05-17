import { Slot } from 'expo-router';
import { TRPCProvider } from './providers';

export default function RootLayout() {
  return (
    <TRPCProvider>
      <Slot />
    </TRPCProvider>
  );
}
