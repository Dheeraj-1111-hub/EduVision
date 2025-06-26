import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const RecentDocuments = () => {
  const documents = [
    { title: "Research Paper.pdf", lastAccessed: "Today" },
    { title: "Meeting Notes.pdf", lastAccessed: "Yesterday" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent Documents</Text>
      {documents.map((doc, index) => (
        <View key={index} style={styles.card}>
          <View>
            <Text style={styles.title}>{doc.title}</Text>
            <Text style={styles.subtitle}>Last accessed: {doc.lastAccessed}</Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <MaterialIcons name="play-arrow" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color:"white",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#4a5568", // Equivalent to primary-700/30
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d3748", // Equivalent to primary-600
    marginBottom: 12,
  },
  title: {
    fontWeight: "500",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "#a0aec0", // Equivalent to text-primary-300
    marginTop: 4,
  },
  button: {
    padding: 8,
    backgroundColor: "#2d3748", // Equivalent to primary-600
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RecentDocuments;
