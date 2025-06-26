import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import * as Speech from "expo-speech";
import Voice from "react-native-voice";
import { useNavigation } from "@react-navigation/native";

const VoiceNavigation = () => {
    const navigation = useNavigation();
    const [recognizedText, setRecognizedText] = useState("");

    useEffect(() => {
        Speech.speak("Say 'Go to Home', 'Go to Library', 'Go to Help', or 'Go to Profile'");

        Voice.onSpeechResults = (result) => {
            if (result.value) {
                const command = result.value[0].toLowerCase();
                setRecognizedText(command);

                if (command.includes("home")) {
                    navigation.navigate("Home");
                } else if (command.includes("library")) {
                    navigation.navigate("Library");
                } else if (command.includes("help")) {
                    navigation.navigate("Help");
                } else if (command.includes("profile")) {
                    navigation.navigate("Profile");
                }
            }
        };
    }, []);

    return (
        <View>
            <Text>Recognized Command: {recognizedText}</Text>
            <Button title="Start Listening" onPress={() => Voice.start("en-US")} />
        </View>
    );
};

export default VoiceNavigation;
