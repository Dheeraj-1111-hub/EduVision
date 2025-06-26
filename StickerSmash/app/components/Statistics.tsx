import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Statistics = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Statistics</Text>

      <View style={styles.card}>
        <View style={styles.grid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Documents Read</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3.5h</Text>
            <Text style={styles.statLabel}>Listening Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Saved Notes</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "white",
  },
  card: {
    padding: 16,
    backgroundColor: "rgba(59, 130, 246, 0.3)", // bg-primary-700/30
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 1)", // border-primary-600
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    
    
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(191, 219, 254, 1)", // text-primary-300
    textAlign: "center",
    marginTop: 4,
  },
});

export default Statistics;
