import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SparksScreen() {
  return (
    <View style={styles.container}>
      {/* Black/Gold Shell */}
      <Text style={styles.header}>Daily Sparks</Text>

      {/* Pastel Pulse Card Layer */}
      <View style={[styles.card, { backgroundColor: '#B8C5B9' }]}>
        <Text style={styles.promptText}>Would you rather...</Text>

        {/* Blind Reveal State Example */}
        <View style={styles.frostedOverlay}>
          <Text style={styles.waitingText}>Waiting for Partner...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808', padding: 20 },
  header: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { borderRadius: 24, padding: 24, minHeight: 300, overflow: 'hidden', position: 'relative' },
  promptText: { fontFamily: 'Fraunces', fontSize: 20, color: '#1A1A1A' },
  frostedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#080808', fontWeight: 'bold' },
});
