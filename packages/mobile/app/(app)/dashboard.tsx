import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { trpc } from '../../src/lib/trpc';

export default function DashboardScreen() {
  const router = useRouter();
  const [pair, setPair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const getMyPairQuery = trpc.pairs.getMyPair.useQuery();

  useEffect(() => {
    if (getMyPairQuery.data) {
      setPair(getMyPairQuery.data);
    }
  }, [getMyPairQuery.data]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    router.replace('/(auth)/login');
  };

  const getStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      ALIGNED: '#4CAF50',
      DORMANT: '#FFC107',
      MISALIGNED: '#FF9800',
      CAPACITY_BLOCKED: '#F44336',
      TRUST_FRACTURED: '#9C27B0',
    };
    return colors[state] || '#D4AF37';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CommonGround</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {pair ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Relationship Status</Text>
            <View
              style={[
                styles.stateBadge,
                { backgroundColor: getStateColor(pair.relationalState) },
              ]}
            >
              <Text style={styles.stateText}>{pair.relationalState}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(app)/bently')}
            >
              <Text style={styles.actionButtonText}>Chat with Bently</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(app)/messages')}
            >
              <Text style={styles.actionButtonText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No active pair</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(onboarding)/invite')}
          >
            <Text style={styles.actionButtonText}>Create or Join a Pair</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  logoutButton: {
    color: '#D4AF37',
    fontSize: 14,
  },
  card: {
    margin: 15,
    padding: 15,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 15,
  },
  stateBadge: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  stateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginVertical: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#080808',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
