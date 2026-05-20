import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Authenticated — go straight to dashboard
        router.replace('/(app)/dashboard');
      } else {
        // First-time / logged-out — show welcome
        setHasToken(false);
        setChecked(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    };
    checkAuth();
  }, []);

  if (!checked) {
    return <View style={styles.container} />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.brandSmall}>AxM</Text>
        <Text style={styles.brand}>CommonGround</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>A third presence for two people.</Text>

        <View style={styles.spacer} />

        <Text style={styles.body}>
          You and your partner share this space.{'\n'}
          Bently holds the middle — not as a coach,{'\n'}
          not as a chatbot, but as a mediator{'\n'}
          who never takes sides.
        </Text>

        <View style={styles.spacer} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Begin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 32,
    paddingTop: 96,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'flex-start',
  },
  brandSmall: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: 6,
  },
  brand: {
    color: '#D4AF37',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#D4AF37',
    marginBottom: 16,
  },
  tagline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '300',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  spacer: {
    height: 32,
  },
  body: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '300',
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
