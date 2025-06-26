import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { supabase } from "../utils/supabase";
import { useRouter } from "expo-router";

const GROQ_API_KEY = "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";

const ChangePasswordScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPhrase, setOldPhrase] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [step, setStep] = useState("phone");
  const [isRecording, setIsRecording] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    requestPermissions();
    Speech.speak("To change your password, long press and say your phone number.");
  }, []);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Microphone Permission", "Please enable microphone access.");
      Speech.speak("Please provide Microphone permission.");
    }
  };

  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation(() => pulseAnim.setValue(1));
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      animatePulse();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      stopPulseAnimation();
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const transcript = await transcribeWithGroq(uri);
      const responseText = transcript.toLowerCase().trim();

      if (responseText.includes("exit")) {
        Speech.speak("Exiting password change. Returning to profile.");
        router.push("/navigation/screens/Profile");
        return;
      }

      if (awaitingConfirmation) {
        handleConfirmation(responseText);
        return;
      }

      switch (step) {
        case "phone":
          const digits = transcript.replace(/\D/g, "").slice(0, 10);
          if (digits.length < 10) {
            Speech.speak("Phone number incomplete. Please try again.");
            return;
          }
          setPhoneNumber(digits);
          Speech.speak(`Phone number detected: ${digits.split("").join(" ")}. Say yes to confirm.`);
          setAwaitingConfirmation(true);
          break;

        case "old":
          setOldPhrase(responseText);
          Speech.speak(`You said: ${responseText}. Is this your old password?`);
          setAwaitingConfirmation(true);
          break;

        case "new":
          setNewPhrase(responseText);
          Speech.speak(`New password will be: ${responseText}. Confirm with yes or no.`);
          setAwaitingConfirmation(true);
          break;
      }
    } catch (err) {
      console.error("Stop recording error:", err);
      Speech.speak("Could not process your input. Try again.");
    }
  };

  const handleConfirmation = async (responseText) => {
    const yes = responseText.includes("yes");
    const no = responseText.includes("no");

    if (!yes && !no) {
      Speech.speak("Please say yes or no to confirm.");
      return;
    }

    if (no) {
      setAwaitingConfirmation(false);
      switch (step) {
        case "phone":
          Speech.speak("Okay, please say your phone number again.");
          setPhoneNumber("");
          break;
        case "old":
          Speech.speak("Okay, please say your old password again.");
          setOldPhrase("");
          break;
        case "new":
          Speech.speak("Okay, please say your new password again.");
          setNewPhrase("");
          break;
      }
      return;
    }

    switch (step) {
      case "phone":
        setStep("old");
        setAwaitingConfirmation(false);
        Speech.speak("Phone confirmed. Now, long press and say your old password phrase.");
        break;

      case "old":
        const { data, error } = await supabase
          .from("voice_auth")
          .select("phrase")
          .eq("phone", phoneNumber)
          .single();

        if (error) {
          console.error("Fetch error:", error);
          Speech.speak("There was a problem fetching your data. Try again.");
          return;
        }

        if (data && normalize(data.phrase) === normalize(oldPhrase)) {
          setStep("new");
          setAwaitingConfirmation(false);
          Speech.speak("Old password matched. Please say your new password.");
        } else {
          Speech.speak("Old password did not match. Try again or say exit to cancel.");
          setOldPhrase("");
          setAwaitingConfirmation(false);
        }
        break;

      case "new":
        const { error: updateError } = await supabase
          .from("voice_auth")
          .update({ phrase: newPhrase.toLowerCase() })
          .eq("phone", phoneNumber);

        if (updateError) {
          console.error("Update error:", updateError);
          Speech.speak("There was a problem updating your password. Try again later.");
        } else {
          Speech.speak("Password updated successfully. Returning to profile.");
          router.push("/navigation/screens/Profile");
        }
        break;
    }
  };

  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/gi, "").trim();

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

  return (
    <Pressable
      style={styles.outerContainer}
      onLongPress={startRecording}
      onPressOut={stopRecording}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Change Password</Text>

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

        {oldPhrase !== "" && (
          <View style={styles.inputContainer}>
            <Icon name="key" size={22} color="#ba68c8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Old Phrase"
              value={oldPhrase}
              editable={false}
              placeholderTextColor="#ccc"
            />
          </View>
        )}

        {newPhrase !== "" && (
          <View style={styles.inputContainer}>
            <Icon name="key-change" size={22} color="#ba68c8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Phrase"
              value={newPhrase}
              editable={false}
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

        <Text style={styles.terms}>
          Say <Text style={styles.link}>exit</Text> anytime to cancel and return to profile.
        </Text>
      </View>
    </Pressable>
  );
};

export default ChangePasswordScreen;

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
