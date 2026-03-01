import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder — will be replaced in Phase 4+
export default function MainTabs() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Main App (Phase 4+)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
