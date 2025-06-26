import React, { useState, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  Platform,
  PanResponder,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import UploadCard from "../../components/UploadCard";
import NavBar from "../../components/NavBar";
import Output from "../../components/Output";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "https://f097-42-111-166-105.ngrok-free.app";
const SUMMARIZE_API_URL = `${BASE_URL}/summarize`;
const QUIZ_API_URL = `${BASE_URL}/quiz`;
const TEACH_EACH_PAGE_API_URL = `${BASE_URL}/teach-each-page`;
const session_id = "00000";
const GROQ_API_KEY = "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";

const Home = () => {
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const lastTapRef = useRef(0);
  const router = useRouter();

  // Speak when tab is focused (including returning from other tabs)
  useFocusEffect(
    useCallback(() => {
      Speech.stop();
      Speech.speak(
        "Welcome to the Home tab. Double tap anywhere to upload your PDF. Long press and speak start or stop to control audio playback."
      );
      return () => {
        Speech.stop();
      };
    }, [])
  );

  const fallbackParse = (text: string) => {
    const questions: any[] = [];
    const blocks = text.split("Question:");
    blocks.shift();

    for (let block of blocks) {
      const [questionLine, ...rest] = block.trim().split("\n");
      const options = rest.filter((line) => /^[A-D]\)/.test(line.trim()));
      const answerMatch = rest.find((line) =>
        /\[A-D]\)/.test(line)
      )?.match(/\[([A-D])\]\)/);

      questions.push({
        question: questionLine.trim(),
        options,
        correct: answerMatch ? "ABCD".indexOf(answerMatch[1]) : 0,
        explanation: "No explanation provided.",
      });
    }

    return questions;
  };

  const parseJsonOrText = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn("⚠ Could not parse JSON. Raw response:", text);
      return { raw_output: text };
    }
  };

  const uploadAndProcessPDF = async (fileUri: string, fileName: string) => {
    setIsLoading(true);
    setExtractedText("");

    const file = {
      uri: fileUri,
      name: fileName,
      type: "application/pdf",
    } as any;

    const formData = new FormData();
    formData.append("file", file);

    try {
      Speech.speak("Generating summary.");
      const summarizeRes = await fetch(SUMMARIZE_API_URL, {
        method: "POST",
        body: formData,
      });
      const summaryJson = await parseJsonOrText(summarizeRes);
      const finalSummary =
        summaryJson?.response || summaryJson?.raw_output || "No summary returned.";
      setExtractedText(finalSummary);
      Speech.speak("Summary generated successfully.");

      Speech.speak("Creating quiz questions.");
      const quizRes = await fetch(QUIZ_API_URL, {
        method: "POST",
        body: formData,
      });
      const quizJson = await parseJsonOrText(quizRes);
      let finalQuiz = [];

      if (quizJson?.quiz && Array.isArray(quizJson.quiz)) {
        finalQuiz = quizJson.quiz.map((q: any) => ({
          question: `${q.question}\n${q.data}`,
          options: Object.entries(q.options).map(
            ([key, value]) => `${key}: ${value}`
          ),
          correct: Object.keys(q.options).indexOf(q.correct_answer.option),
        }));
      } else if (Array.isArray(quizJson)) {
        finalQuiz = quizJson;
      } else if (quizJson?.questions) {
        finalQuiz = quizJson.questions;
      } else if (quizJson?.raw_output) {
        finalQuiz = fallbackParse(quizJson.raw_output);
      }

      const explainForm = new FormData();
      explainForm.append("file", file);
      explainForm.append("query", "Explain page 1");
      explainForm.append("session_id", session_id);

      Speech.speak("Fetching detailed explanations.");
      let finalExplanation = "No explanation available.";
      try {
        const explainRes = await fetch(TEACH_EACH_PAGE_API_URL, {
          method: "POST",
          body: explainForm,
        });

        const explainJson = await parseJsonOrText(explainRes);
        finalExplanation =
          explainJson?.response || explainJson?.raw_output || finalExplanation;
        Speech.speak("Explanations added.");
      } catch {
        Speech.speak("Failed to fetch detailed explanations.");
      }

      await AsyncStorage.setItem("quizData", JSON.stringify(finalQuiz));
      await AsyncStorage.setItem("explanation", finalExplanation);
      await AsyncStorage.setItem("session_id", session_id);
      await AsyncStorage.setItem("file", JSON.stringify(file)); 

      Speech.speak("You can swipe to Help or Library tab to access the content.");
    } catch (error) {
      console.error("Upload error:", error);
      setExtractedText("Error processing document.");
      Speech.speak("An error occurred while processing your document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoubleTap = async () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
        });

        if (!result.canceled) {
          const uri = result.assets[0].uri;
          const fileName = uri.split("/").pop() || "document.pdf";
          Speech.speak("PDF selected. Uploading and processing now.");
          await uploadAndProcessPDF(uri, fileName);
        } else {
          Speech.speak("No file selected.");
        }
      } catch (error) {
        console.error("Picker error:", error);
        Speech.speak("An error occurred while picking the file.");
      }
    }
    lastTapRef.current = now;
  };

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err) {
      console.error("Recording error:", err);
    }
  }, []);

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      const status = await recording.getStatusAsync();
      if (!status.isRecording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

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
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      const command = (data?.text || "").trim().toLowerCase();
      console.log("🎙 Groq transcription:", command);

      if (command.includes("start")) {
        Speech.speak(extractedText || "There is no summary to read.");
      } else if (command.includes("stop")) {
        Speech.stop();
      } else {
        Speech.speak("Sorry, I didn't understand. Please say start or stop.");
      }
    } catch (err) {
      console.error("Groq STT error:", err);
      Speech.speak("An error occurred while interpreting your voice.");
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 30,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          Speech.speak("Navigating to Profile tab.");
          router.push("/navigation/screens/Profile");
        } else if (gestureState.dx < -50) {
          Speech.speak("Navigating to Library tab.");
          router.push("/navigation/screens/Library");
        }
      },
    })
  ).current;

  return (
    <View style={styles.mainContainer} {...panResponder.panHandlers}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          onLongPress={startRecording}
          onPressOut={stopRecording}
          onPress={handleDoubleTap}
          style={styles.pressableArea}
          delayLongPress={500}
        >
          <UploadCard />
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B4CCA" />
              <Text style={styles.loadingText}>
                Processing your document...
              </Text>
            </View>
          ) : (
            <Output extractedText={extractedText} />
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "black",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  pressableArea: {
    flex: 1,
    marginTop: 0,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
  },
});

export default Home;
