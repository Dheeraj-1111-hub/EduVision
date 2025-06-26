import React, { useState, useEffect, useContext, createContext } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Switch } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";
import Slider from "@react-native-community/slider"; // Updated import for Slider

// Create a theme context to manage app-wide settings
const ThemeContext = createContext({
  isDarkMode: true,
  speechRate: 0.9,
  speechPitch: 1.0,
  isMuted: false,
  highContrast: false,
  fontSize: 2,
  toggleDarkMode: () => {},
  setSpeechRate: () => {},
  setSpeechPitch: () => {},
  toggleMute: () => {},
  toggleHighContrast: () => {},
  setFontSize: () => {},
});

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(2);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    if (!isMuted) {
      Speech.speak(`Dark mode ${!isDarkMode ? 'enabled' : 'disabled'}`, {
        rate: speechRate,
        pitch: speechPitch,
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (isMuted) {
      Speech.speak("Voice guidance turned on", {
        rate: speechRate,
        pitch: speechPitch,
      });
    } else {
      Speech.stop();
    }
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
    if (!isMuted) {
      Speech.speak(`High contrast mode ${!highContrast ? 'enabled' : 'disabled'}`, {
        rate: speechRate,
        pitch: speechPitch,
      });
    }
  };

  const speak = (text) => {
    if (!isMuted) {
      Speech.speak(text, {
        language: "en-US",
        rate: speechRate,
        pitch: speechPitch,
      });
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        speechRate,
        speechPitch,
        isMuted,
        highContrast,
        fontSize,
        toggleDarkMode,
        setSpeechRate,
        setSpeechPitch,
        toggleMute,
        toggleHighContrast,
        setFontSize,
        speak,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to access theme context
export const useTheme = () => useContext(ThemeContext);

// Settings Screen Component
const SettingsScreen = ({ visible, onClose }) => {
  const theme = useTheme();
  
  // Determine theme colors
  const colors = getThemeColors(theme.isDarkMode, theme.highContrast);

  // Announce screen when opened
  useEffect(() => {
    if (visible && !theme.isMuted) {
      theme.speak("Settings screen opened. Adjust voice speed, pitch, and other accessibility options here.");
    }
  }, [visible]);

  const handleRateChange = (value) => {
    theme.setSpeechRate(value);
    if (!theme.isMuted) {
      Speech.speak(`Speech rate set to ${Math.round(value * 10) / 10}`, {
        rate: value,
        pitch: theme.speechPitch,
      });
    }
  };

  const handlePitchChange = (value) => {
    theme.setSpeechPitch(value);
    if (!theme.isMuted) {
      Speech.speak(`Pitch set to ${Math.round(value * 10) / 10}`, {
        rate: theme.speechRate,
        pitch: value,
      });
    }
  };

  const changeFontSize = (newSize) => {
    theme.setFontSize(newSize);
    const sizeName = ["Small", "Medium", "Large", "Extra Large"][newSize - 1];
    if (!theme.isMuted) {
      Speech.speak(`Font size set to ${sizeName}`, {
        rate: theme.speechRate,
        pitch: theme.speechPitch,
      });
    }
  };

  const resetToDefaults = () => {
    theme.setSpeechRate(0.9);
    theme.setSpeechPitch(1.0);
    theme.toggleMute(false);
    theme.toggleHighContrast(false);
    theme.setFontSize(2);
    
    if (!theme.isMuted) {
      Speech.speak("Restored default settings.", {
        rate: 0.9,
        pitch: 1.0,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity 
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close settings"
            accessibilityHint="Double tap to close settings screen"
          >
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.settingsContainer}>
          {/* Voice Guidance */}
          <View style={[styles.settingSection, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Guidance</Text>
            
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Voice Enabled</Text>
              <Switch
                value={!theme.isMuted}
                onValueChange={theme.toggleMute}
                trackColor={{ false: '#767577', true: '#9e6dff' }}
                thumbColor={!theme.isMuted ? '#611BF8' : '#f4f3f4'}
                accessible={true}
                accessibilityLabel={`Voice guidance ${!theme.isMuted ? 'enabled' : 'disabled'}`}
                accessibilityHint="Double tap to toggle voice guidance"
              />
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>Speech Rate: {theme.speechRate.toFixed(1)}</Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: colors.secondaryText }]}>Slow</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={1.5}
                step={0.1}
                value={theme.speechRate}
                onValueChange={handleRateChange}
                minimumTrackTintColor="#611BF8"
                maximumTrackTintColor={colors.sliderTrack}
                thumbTintColor="#9e6dff"
                accessible={true}
                accessibilityLabel={`Speech rate slider, currently ${theme.speechRate.toFixed(1)}`}
                accessibilityHint="Slide left for slower speech, right for faster speech"
              />
              <Text style={[styles.sliderLabel, { color: colors.secondaryText }]}>Fast</Text>
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>Pitch: {theme.speechPitch.toFixed(1)}</Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: colors.secondaryText }]}>Low</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.8}
                maximumValue={1.2}
                step={0.1}
                value={theme.speechPitch}
                onValueChange={handlePitchChange}
                minimumTrackTintColor="#611BF8"
                maximumTrackTintColor={colors.sliderTrack}
                thumbTintColor="#9e6dff"
                accessible={true}
                accessibilityLabel={`Voice pitch slider, currently ${theme.speechPitch.toFixed(1)}`}
                accessibilityHint="Slide left for lower pitch, right for higher pitch"
              />
              <Text style={[styles.sliderLabel, { color: colors.secondaryText }]}>High</Text>
            </View>
          </View>

          {/* Visual Settings */}
          <View style={[styles.settingSection, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Visual Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={theme.isDarkMode}
                onValueChange={theme.toggleDarkMode}
                trackColor={{ false: '#767577', true: '#9e6dff' }}
                thumbColor={theme.isDarkMode ? '#611BF8' : '#f4f3f4'}
                accessible={true}
                accessibilityLabel={`Dark mode ${theme.isDarkMode ? 'enabled' : 'disabled'}`}
                accessibilityHint="Double tap to toggle dark mode"
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>High Contrast</Text>
              <Switch
                value={theme.highContrast}
                onValueChange={theme.toggleHighContrast}
                trackColor={{ false: '#767577', true: '#9e6dff' }}
                thumbColor={theme.highContrast ? '#611BF8' : '#f4f3f4'}
                accessible={true}
                accessibilityLabel={`High contrast mode ${theme.highContrast ? 'enabled' : 'disabled'}`}
                accessibilityHint="Double tap to toggle high contrast mode"
              />
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>Font Size</Text>
            <View style={styles.fontSizeContainer}>
              {[1, 2, 3, 4].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeButton,
                    { backgroundColor: colors.buttonBg },
                    theme.fontSize === size && [styles.selectedFontSize, { borderColor: '#611BF8' }]
                  ]}
                  onPress={() => changeFontSize(size)}
                  accessible={true}
                  accessibilityLabel={`Font size ${["Small", "Medium", "Large", "Extra Large"][size - 1]}`}
                  accessibilityState={{ selected: theme.fontSize === size }}
                  accessibilityHint="Double tap to select this font size"
                >
                  <Text style={[
                    styles.fontSizeText,
                    { fontSize: 12 + (size * 2), color: colors.text }
                  ]}>
                    Aa
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Help Options */}
          <View style={[styles.settingSection, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Options</Text>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primaryButton }]}
              onPress={() => {
                theme.speak("Tutorial will guide you through the app features step by step.");
              }}
              accessible={true}
              accessibilityLabel="Start tutorial"
              accessibilityHint="Double tap to start the app tutorial"
            >
              <MaterialIcons name="school" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Start Tutorial</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primaryButton }]}
              onPress={resetToDefaults}
              accessible={true}
              accessibilityLabel="Reset to default settings"
              accessibilityHint="Double tap to restore all settings to default values"
            >
              <MaterialIcons name="restore" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Helper function to get theme colors
const getThemeColors = (isDarkMode, isHighContrast) => {
  if (isDarkMode) {
    return {
      primary: '#611BF8',
      primaryButton: '#611BF8',
      background: '#121212',
      cardBg: '#1E1E1E',
      headerBg: '#1A1A1A',
      text: isHighContrast ? '#FFFFFF' : '#E0E0E0',
      secondaryText: isHighContrast ? '#FFFFFF' : '#9E9E9E',
      buttonBg: '#2D2D2D',
      sliderTrack: '#424242',
    };
  } else {
    return {
      primary: '#611BF8',
      primaryButton: '#611BF8',
      background: '#F5F5F5',
      cardBg: '#FFFFFF',
      headerBg: '#F0F0F0',
      text: isHighContrast ? '#000000' : '#333333',
      secondaryText: isHighContrast ? '#000000' : '#666666',
      buttonBg: '#F0F0F0',
      sliderTrack: '#DADADA',
    };
  }
};

// Help Screen Component
const HelpScreen = ({ visible, onClose }) => {
  const theme = useTheme();
  const colors = getThemeColors(theme.isDarkMode, theme.highContrast);

  useEffect(() => {
    if (visible) {
      theme.speak("Help guide. This screen explains how to use the app. Swipe through the different sections to learn about each feature.");
    }
  }, [visible]);

  const helpTopics = [
    {
      title: "Navigation Basics",
      icon: "navigation",
      content: "Double tap anywhere to select. Swipe left or right to move between elements. Three finger swipe to scroll pages.",
    },
    {
      title: "Voice Commands",
      icon: "mic",
      content: "Long press anywhere to activate voice commands. After the beep, speak your question clearly.",
    },
    {
      title: "Document Reading",
      icon: "description",
      content: "Upload documents by double tapping the center of the screen. The app will read documents aloud automatically.",
    },
    {
      title: "Asking Questions",
      icon: "question-answer",
      content: "Ask questions about your documents using voice commands. Start with phrases like 'What is' or 'Tell me about'.",
    },
    {
      title: "Navigation Bar",
      icon: "menu",
      content: "The navigation bar has help and settings buttons. Double tap to open, long press for voice control.",
    }
  ];

  const speakHelpTopic = (topic) => {
    theme.speak(topic.title + ". " + topic.content);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Help Guide</Text>
          <TouchableOpacity 
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close help"
            accessibilityHint="Double tap to close help screen"
          >
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.helpContainer}>
          {helpTopics.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.helpTopic, { backgroundColor: colors.cardBg }]}
              onPress={() => speakHelpTopic(topic)}
              accessible={true}
              accessibilityLabel={topic.title}
              accessibilityHint={`Double tap to hear about ${topic.title}`}
            >
              <View style={styles.helpIconContainer}>
                <MaterialIcons name={topic.icon} size={28} color="#611BF8" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={[styles.helpTopicTitle, { color: colors.text }]}>{topic.title}</Text>
                <Text style={[styles.helpTopicContent, { color: colors.secondaryText }]}>{topic.content}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primaryButton }]}
            onPress={() => {
              theme.speak("Starting interactive tutorial. This will guide you through all app features with practical examples.");
              // Here you would launch your tutorial flow
            }}
            accessible={true}
            accessibilityLabel="Start interactive tutorial"
            accessibilityHint="Double tap to begin an interactive tutorial of the app"
          >
            <MaterialIcons name="play-circle-filled" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Start Interactive Tutorial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#507DFF' }]}
            onPress={() => {
              theme.speak("Contact support. Email help at edu vision dot com or call our accessibility hotline at 555-123-4567.");
            }}
            accessible={true}
            accessibilityLabel="Contact support"
            accessibilityHint="Double tap to hear contact information for support"
          >
            <MaterialIcons name="support-agent" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Contact Support</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Updated NavBar Component
const NavBar = () => {
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const theme = useTheme();
  const colors = getThemeColors(theme.isDarkMode, theme.highContrast);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechError = (e) => {
      console.log("Speech error", e);
      theme.speak("Sorry, I couldn't hear you. Please try again.");
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResultsHandler = async (event) => {
    const spokenText = event.value[0];
    console.log("User asked:", spokenText);
    theme.speak("Processing your question.");

    // Handle voice commands for settings
    if (spokenText.toLowerCase().includes("faster")) {
      const newRate = Math.min(theme.speechRate + 0.1, 1.5);
      theme.setSpeechRate(newRate);
      theme.speak(`Speech rate set to ${newRate.toFixed(1)}`);
      return;
    } else if (spokenText.toLowerCase().includes("slower")) {
      const newRate = Math.max(theme.speechRate - 0.1, 0.5);
      theme.setSpeechRate(newRate);
      theme.speak(`Speech rate set to ${newRate.toFixed(1)}`);
      return;
    } else if (spokenText.toLowerCase().includes("mute") || spokenText.toLowerCase().includes("silence")) {
      theme.toggleMute();
      return;
    } else if (spokenText.toLowerCase().includes("dark mode") || spokenText.toLowerCase().includes("light mode")) {
      theme.toggleDarkMode();
      return;
    }

    try {
      const reply = await askGroq(spokenText);
      theme.speak(reply);
    } catch (err) {
      console.error("Groq error:", err);
      theme.speak("Sorry, something went wrong.");
    }
  };

  const askGroq = async (question) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer YOUR_GROQ_API_KEY`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for a blind-friendly mobile app. Give clear and simple responses.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await res.json();
    return data.choices[0]?.message?.content || "I couldn't find the answer.";
  };

  const handleHelpPress = () => {
    theme.speak("Opening help guide.");
    setHelpVisible(true);
  };

  const handleHelpLongPress = async () => {
    theme.speak("You're now in help mode. Ask your question after the beep.");

    setTimeout(() => {
      Voice.start("en-US");
    }, 1000);
  };

  const handleSettingsPress = () => {
    theme.speak("Opening settings.");
    setSettingsVisible(true);
  };

  const handleSettingsLongPress = () => {
    theme.speak("Settings voice control. Say faster, slower, or mute to adjust speech.");
    setTimeout(() => {
      Voice.start("en-US");
    }, 1000);
  };

  return (
    <>
      <View style={[styles.navbar, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>EduVision</Text>

        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            accessible={true}
            accessibilityLabel="Help"
            accessibilityHint="Double tap for help guide, long press to ask a question"
            onPress={handleHelpPress}
            onLongPress={handleHelpLongPress}
          >
            <MaterialIcons name="help-outline" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            accessible={true}
            accessibilityLabel="Settings"
            accessibilityHint="Double tap for settings, long press for voice control"
            onPress={handleSettingsPress}
            onLongPress={handleSettingsLongPress}
          >
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings and Help Modals */}
      <SettingsScreen 
        visible={settingsVisible} 
        onClose={() => {
          setSettingsVisible(false);
          theme.speak("Settings closed.");
        }} 
      />
      
      <HelpScreen 
        visible={helpVisible} 
        onClose={() => {
          setHelpVisible(false);
          theme.speak("Help guide closed.");
        }} 
      />
    </>
  );
};

// App component with theme provider
const AppWithTheme = () => {
  return (
    <ThemeProvider>
      <NavBar />
    </ThemeProvider>
  );
};

const styles = {
  // Original NavBar styles
  navbar: {
    backgroundColor: "#611BF8", // This will be overridden by the theme
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  
  // Modal common styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  
  // Settings screen styles
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    width: 40,
    textAlign: "center",
    fontSize: 14,
  },
  fontSizeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  fontSizeButton: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  selectedFontSize: {
    borderWidth: 2,
  },
  fontSizeText: {
    fontWeight: "bold",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  
  // Help screen styles
  helpContainer: {
    flex: 1,
    padding: 16,
  },
  helpTopic: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  helpIconContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helpTopicTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  helpTopicContent: {
    fontSize: 14,
    lineHeight: 20,
  },
};

export default AppWithTheme;