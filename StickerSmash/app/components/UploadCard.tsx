import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://138d-2402-3a80-469-f421-8e8-5c45-ce1c-fa5a.ngrok-free.app";
const SUMMARIZE_API_URL = `${BASE_URL}/summarize`;
const QUIZ_API_URL = `${BASE_URL}/quiz`;
const TEACH_EACH_PAGE_API_URL = `${BASE_URL}/teach-each-page`;
const session_id = "00000";

const UploadScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const lastTapRef = useRef<number>(0);

  const parseJsonOrText = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn("⚠ Could not parse JSON. Raw response:", text);
      return { raw_output: text };
    }
  };

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
      // === 1. Summarize ===
      Speech.speak("Generating summary.");
      const summarizeRes = await fetch(SUMMARIZE_API_URL, {
        method: "POST",
        body: formData,
      });
      const summaryJson = await parseJsonOrText(summarizeRes);
      const finalSummary =
        summaryJson?.response ||
        summaryJson?.raw_output ||
        "No summary returned.";
      setExtractedText(finalSummary);
      Speech.speak("Summary generated successfully.");

      // === 2. Quiz ===
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

      // === 3. Explanation ===
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
          explainJson?.response ||
          explainJson?.raw_output ||
          finalExplanation;
        Speech.speak("Explanations added.");
      } catch {
        Speech.speak("Failed to fetch detailed explanations.");
      }

      await AsyncStorage.setItem("quizData", JSON.stringify(finalQuiz));
      await AsyncStorage.setItem("explanation", finalExplanation);
      await AsyncStorage.setItem("session_id", session_id);
      await AsyncStorage.setItem("summary", finalSummary);
      
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

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="mic" size={48} color="white" />
      </View>
      <Text style={styles.title}>Upload a document to get started</Text>
      <Text style={styles.subtitle}>
        We'll read your PDF documents aloud with a natural voice
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>
            Processing your document...
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleDoubleTap}>
          <MaterialIcons name="upload-file" size={24} color="white" />
          <Text style={styles.buttonText}>Upload PDF</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.tipText}>
        Double-tap to select a file
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(29, 78, 216, 0.5)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E40AF",
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#611BF8",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#172554",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#93C5FD",
    textAlign: "center",
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#611BF8",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 12,
  },
  processingText: {
    color: "white",
    fontSize: 14,
    marginTop: 10,
  },
  tipText: {
    fontSize: 12,
    color: "#93C5FD",
    textAlign: "center",
    marginTop: 8,
  },
});

export default UploadScreen;