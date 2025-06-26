import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Speech from "expo-speech";

type Props = {
  extractedText: string;
};

const Output = ({ extractedText }: Props) => {
  const speakText = () => {
    if (extractedText) {
      Speech.speak(extractedText, {
        language: "en",
        pitch: 1.0,
        rate: 1.0,
      });
    }
  };

  const pauseSpeech = () => {
    // Real pause is not reliable; stop instead
    Speech.stop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Document Content</Text>
      <View style={styles.contentBox}>
        <Text style={styles.contentText}>
          {extractedText || "No summary yet. Upload a PDF to see content here."}
        </Text>

        {/* Start Listening Button */}
        <TouchableOpacity style={styles.listenButton} onPress={speakText}>
          <Text style={styles.listenText}>🎧 Start Listening</Text>
        </TouchableOpacity>

        {/* Pause (Stop) Listening Button */}
        <TouchableOpacity style={[styles.listenButton, { marginTop: 10 }]} onPress={pauseSpeech}>
          <Text style={styles.listenText}>⏸️ Pause Listening</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    alignSelf: "center",
  },
  contentBox: {
    backgroundColor: "#1E2A78",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  contentText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  listenButton: {
    backgroundColor: "#3B4CCA",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "center",
  },
  listenText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Output;
