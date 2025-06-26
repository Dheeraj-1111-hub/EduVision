import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
} from "react-native";
import NavBar from "../../components/NavBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { useRouter } from "expo-router";

const TEACH_EACH_PAGE_API_URL =
  "https://f097-42-111-166-105.ngrok-free.app/teach-each-page";

const Library = () => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenIndex, setSpokenIndex] = useState<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const currentLineIndexRef = useRef<number>(0);
  const linesRef = useRef<string[]>([]);
  const router = useRouter();

  const speak = (text: string) => {
    Speech.speak(text, { rate: 0.9 });
  };

  const stopSpeech = () => {
    Speech.stop();
    currentLineIndexRef.current = 0;
  };

  const speakExplanationLineByLine = () => {
    const lines = linesRef.current;

    const speakNextLine = () => {
      const index = currentLineIndexRef.current;

      if (index >= lines.length) {
        setSpokenIndex(null);
        return;
      }

      setSpokenIndex(index);
      Speech.speak(lines[index], {
        rate: 0.9,
        onDone: () => {
          currentLineIndexRef.current += 1;
          speakNextLine();
        },
      });
    };

    if (lines.length > 0) {
      speakNextLine();
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Microphone permission is needed.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      });

      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      speak("Listening...");
    } catch (error) {
      console.error("Error starting recording:", error);
      speak("Failed to start recording.");
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) return;

      const status = await recording.getStatusAsync();
      if (!status.isRecording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) return;

      const storedPdfStr = await AsyncStorage.getItem("file");

      if (!storedPdfStr) {
        speak("No file found. Please upload one from Home screen.");
        return;
      }

      const parsedPdf = JSON.parse(storedPdfStr);

      const audioFile = {
        uri,
        type: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
        name: "speech.m4a",
      };

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-large-v3");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer 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",
          },
          body: formData,
        }
      );

      const data = await response.json();
      const command = (data?.text || "").trim().toLowerCase();

      if (command.includes("explain") || command.includes("teach")) {
        const formDataToAPI = new FormData();
        formDataToAPI.append("file", {
          uri: parsedPdf.uri,
          type: "application/pdf",
          name: parsedPdf.name,
        });
        formDataToAPI.append("query", command);

        const apiResponse = await fetch(TEACH_EACH_PAGE_API_URL, {
          method: "POST",
          body: formDataToAPI,
        });

        const apiData = await apiResponse.json();
        const explanationText =
          apiData?.response || apiData?.raw_output || "No explanation found.";

        setExplanation(explanationText);
        linesRef.current = explanationText.split(/(?<=[.?!])\s+/);
        currentLineIndexRef.current = 0;
        setTimeout(() => speakExplanationLineByLine(), 1000);
      } else {
        Speech.speak("Sorry, I didn't understand. Please say explain or teach.");
      }
    } catch (err) {
      console.error("Groq STT error:", err);
      Speech.speak("An error occurred while interpreting your voice.");
    }
  };

  const handleSwipe = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    if (translationX > 100) {
      router.push("/navigation/screens/Home");
    } else if (translationX < -100) {
      router.push("/navigation/screens/Quiz");
    }
  };

  useEffect(() => {
    (async () => {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      console.log("📦 Storage contents:", items);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeech();
      };
    }, [])
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <Pressable
          style={styles.container}
          onLongPress={startRecording}
          onPressOut={stopRecordingAndTranscribe}
          delayLongPress={300}
        >
          <View style={styles.navBarContainer}>
            <NavBar />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#3B4CCA" />
            ) : explanation ? (
              linesRef.current.map((line, index) => (
                <Text
                  key={index}
                  style={[
                    styles.explanationText,
                    index === spokenIndex && styles.highlightedText,
                  ]}
                >
                  {line}
                </Text>
              ))
            ) : (
              <Text style={styles.explanationText}>
                Long press anywhere and say “explain” or “teach”.
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    backgroundColor: "#000",
  },
  navBarContainer: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  explanationText: {
    fontSize: 18,
    lineHeight: 30,
    color: "#fff",
  },
  highlightedText: {
    backgroundColor: "#ffeb3b",
  },
});

export default Library;
