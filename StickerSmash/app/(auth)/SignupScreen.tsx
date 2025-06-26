import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { supabase } from "../utils/supabase";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GROQ_API_KEY = "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";
const MAX_ATTEMPTS = 3;

const AuthScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phrase, setPhrase] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [awaitingPhrase, setAwaitingPhrase] = useState(false);
  const [mode, setMode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    requestPermissions();
    resetState();
    Speech.speak("Welcome. Long press anywhere to speak your phone number.");
  }, []);

  const resetState = () => {
    setPhoneNumber("");
    setPhrase("");
    setAwaitingPhrase(false);
    setAwaitingConfirmation(false);
    setMode("");
    setAttempts(0);
  };

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Microphone Permission", "Please enable microphone access.");
      Speech.speak("Please provide Microphone permission access");
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      animatePulse();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(1);
    });
  };

  const stopRecording = async () => {
    try {
      stopPulseAnimation();
      setIsRecording(false);
      const recording = recordingRef.current;
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsLoading(true);
      const transcript = await transcribeWithGroq(uri);
      setIsLoading(false);

      if (transcript.toLowerCase().includes("help")) {
        resetState();
        Speech.speak("To begin, long press and speak your 10-digit phone number.");
        return;
      }

      if (!awaitingPhrase) {
        const digits = transcript.replace(/\D/g, "").slice(0, 10);
        setPhoneNumber(digits);
        Speech.speak(`Phone number detected: ${digits.split("").join(" ")}`);
        setAwaitingConfirmation(true);
        Speech.speak("Please confirm. Is this correct? Say yes or no after long press.");
      } else {
        setPhrase(transcript.trim());
        Speech.speak(`You said: ${transcript}. Confirm with yes or no.`);
        setAwaitingConfirmation(true);
      }
    } catch (err) {
      console.error("Stop recording error:", err);
      setIsLoading(false);
      Speech.speak("Could not process the audio.");
    }
  };

  const normalize = (str) =>
    str.toLowerCase().replace(/[^\w\s]/gi, "").trim();

  const handleConfirmation = async () => {
    try {
      stopPulseAnimation();
      setIsRecording(false);
      const recording = recordingRef.current;
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsLoading(true);
      const transcript = await transcribeWithGroq(uri);
      setIsLoading(false);

      const responseText = transcript.toLowerCase();

      if (responseText.includes("yes")) {
        if (!awaitingPhrase) {
          setAwaitingConfirmation(false);
          setAwaitingPhrase(true);
          const { data } = await supabase
            .from("voice_auth")
            .select("*")
            .eq("phone", phoneNumber)
            .single();

          if (data) {
            setMode("login");
            Speech.speak("Welcome back. Long press and speak your login phrase.");
          } else {
            setMode("register");
            Speech.speak("New user. Please long press and speak your phrase to register.");
          }
        } else {
          if (mode === "register") {
            await supabase.from("voice_auth").insert({
              phone: phoneNumber,
              phrase: phrase.toLowerCase(),
            });
            await AsyncStorage.setItem("token", phoneNumber);
            Speech.speak("Registration successful! You are now logged in.");
          } else {
            const { data } = await supabase
              .from("voice_auth")
              .select("phrase")
              .eq("phone", phoneNumber)
              .single();

            if (normalize(data?.phrase) === normalize(phrase)) {
              await AsyncStorage.setItem("token", phoneNumber);
              Speech.speak("Login successful!");
            } else {
              const newAttempts = attempts + 1;
              setAttempts(newAttempts);
              if (newAttempts >= MAX_ATTEMPTS) {
                Speech.speak("Too many failed attempts. Please try again later.");
                resetState();
              } else {
                Speech.speak("Phrase did not match. Try again.");
                setAwaitingPhrase(true);
              }
              return;
            }
          }
          resetState();
          router.push("/navigation/screens/Home");
        }
      } else if (responseText.includes("no")) {
        Speech.speak("Please long press again to retry.");
        if (awaitingPhrase) setPhrase("");
        else setPhoneNumber("");
        setAwaitingConfirmation(false);
      } else {
        Speech.speak("Sorry, I didn't understand. Please say yes or no.");
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      setIsLoading(false);
      Speech.speak("Could not understand. Try again.");
    }
  };

  const transcribeWithGroq = async (fileUri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: "audio.wav",
      type: "audio/wav",
    });
    formData.append("model", "whisper-large-v3");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.text;
  };

  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <Pressable
      style={styles.outerContainer}
      onLongPress={startRecording}
      onPressOut={awaitingConfirmation ? handleConfirmation : stopRecording}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Register / Login</Text>
        <Text style={styles.label}>
          <Icon name="cellphone" size={20} color="#e1bee7" /> Speak your Phone Number
        </Text>

        <View style={styles.inputContainer}>
          <Icon name="phone" size={22} color="#ba68c8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="numeric"
            maxLength={10}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor="#ccc"
          />
        </View>

        {awaitingPhrase && (
          <View style={styles.inputContainer}>
            <Icon name="account-voice" size={22} color="#ba68c8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phrase"
              value={phrase}
              onChangeText={setPhrase}
              placeholderTextColor="#ccc"
            />
          </View>
        )}

        <Text style={styles.orText}>──── OR ────</Text>
        <Text style={styles.label}>
          <Icon name="microphone" size={20} color="#e1bee7" /> Long press to speak
        </Text>

        {isRecording && (
          <Animated.View
            style={[styles.pulseCircleWithMic, { transform: [{ scale: pulseAnim }] }]}
          >
            <Icon name="microphone" size={30} color="#fff" />
          </Animated.View>
        )}

        {isLoading && <ActivityIndicator color="#e1bee7" style={{ marginTop: 10 }} />}

        <Text style={styles.terms}>
          By continuing, you agree to our {" "}
          <Text style={styles.link}>Terms & Conditions</Text> and {" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>
    </Pressable>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#1b002d",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#3c1053",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#ba68c8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    alignItems: "center",
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#f3e5f5",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#d1c4e9",
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a148c",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ba68c8",
    width: "100%",
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    fontSize: 16,
    paddingLeft: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  orText: {
    color: "#d1c4e9",
    marginVertical: 16,
    fontSize: 16,
  },
  pulseCircleWithMic: {
    marginTop: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ba68c8",
    justifyContent: "center",
    alignItems: "center",
  },
  terms: {
    color: "#b39ddb",
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
  },
});
