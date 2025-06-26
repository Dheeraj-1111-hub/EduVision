import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LoginHeader = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title} accessibilityLabel="Login Screen">Login Screen</Text>
        
      </View>
      <Text style={styles.subtitle}>Accessible login for visually impaired users</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E3A8A', // Adjust based on your theme
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 24,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#A3BFFA',
  },
});

export default LoginHeader;
