import NavBar from '@/app/components/NavBar';
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useRouter, useFocusEffect } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileAccess = () => {
  const [recording, setRecording] = useState(null);
  const [userPhone, setUserPhone] = useState('+91 7395961001'); // Default phone number
  const [lastLogin, setLastLogin] = useState('Today, 2:30 PM');
  const [profileUpdated, setProfileUpdated] = useState('3 days ago');
  const router = useRouter();

  const GROQ_API_KEY = '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'; // Replace with env var

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      Speech.speak('Profile tab');
    }, [])
  );

  useEffect(() => {
    Speech.speak(
      "You are now in the profile tab. Long press anywhere on the screen to change password or log out.",
      { rate: 0.9, pitch: 1.0 }
    );
  }, []);

  // Function to fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      // Try to get phone number from AsyncStorage
      const storedPhone = await AsyncStorage.getItem('userPhone');
      
      // If we have a phone number in storage, use it
      if (storedPhone) {
        setUserPhone(storedPhone);
      }
      
      // In a real app, you would fetch the profile details from your API here
      // For demonstration, we're setting mock data
      
      // Update login time to current time
      const now = new Date();
      const formattedTime = `Today, ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      setLastLogin(formattedTime);
      
      // Save the phone number to AsyncStorage for future use
      await AsyncStorage.setItem('userPhone', userPhone);
      
      // Speak confirmation
      Speech.speak("Profile loaded successfully.", { rate: 0.9 });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If there's an error, we already have default values set in the state
    }
  };

  const handleChangePassword = () => {
    Speech.speak("Redirecting to password change screen.", { rate: 0.9 });
    router.push('/(auth)/changepassword');
  };

  const handleLogout = async () => {
    try {
      // Clear user data from storage
      await AsyncStorage.removeItem('userPhone');
      
      Speech.speak("You have been logged out successfully.", { rate: 0.9 });
      router.replace('/(auth)/SignupScreen');
    } catch (error) {
      console.error('Logout error:', error);
      Speech.speak("Logout failed. Please try again.", { rate: 0.9 });
    }
  };

  const handleLongPress = async () => {
    await startRecording();
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setTimeout(() => stopRecording(recording), 4000);
    } catch (error) {
      console.error('Recording error:', error);
      Speech.speak("Recording failed. Please try again.", { rate: 0.9 });
    }
  };

  const stopRecording = async (recording) => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      transcribeWithGroq(uri);
    } catch (error) {
      console.error('Stopping error:', error);
      Speech.speak("Failed to process your voice. Please try again.", { rate: 0.9 });
    }
  };

  const transcribeWithGroq = async (audioUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        name: 'audio.wav',
        type: 'audio/wav',
      });
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      const command = data.text?.toLowerCase();

      if (typeof command === 'string') {
        if (command.includes('password')) {
          handleChangePassword();
        } else if (command.includes('log out') || command.includes('logout')) {
          handleLogout();
        } else if (command.includes('refresh') || command.includes('reload')) {
          Speech.speak("Refreshing profile data", { rate: 0.9 });
          fetchUserProfile();
        } else {
          Speech.speak("Command not recognized. Try saying 'change password' or 'log out'.", { rate: 0.9 });
        }
      } else {
        Speech.speak("Sorry, I couldn't understand you.", { rate: 0.9 });
      }
    } catch (error) {
      console.error('Groq error:', error);
      Speech.speak("Sorry, something went wrong. Try again.", { rate: 0.9 });
    }
  };

  const handleSwipe = ({ nativeEvent }) => {
    const { translationX, state } = nativeEvent;
    if (state === 5) {
      if (translationX > 50) {
        router.replace('/navigation/screens/Quiz'); // Swipe right → Go to Help
      } else {
        router.replace('/navigation/screens/Home'); // Swipe right → Go to Help
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <ScrollView>
          <TouchableWithoutFeedback onLongPress={handleLongPress}>
            <View style={{ flex: 1, backgroundColor: 'black' }}>
              <NavBar />
              <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profilePicContainer}>
                  <View style={styles.profilePic}>
                    <Icon name="person" size={40} color="#fff" />
                  </View>
                  <Text style={styles.subtitle}>User</Text>
                </View>

                <View style={styles.supportSection}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>User Information</Text>
                    <Text style={styles.cardText}>Phone: {userPhone}</Text>
                    <View style={styles.inline}>
                      <Icon name="verified" size={18} color="#D8B4FE" />
                      <Text style={styles.cardText}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Recent Activities</Text>
                    <View style={styles.inline}>
                      <Icon name="login" size={18} color="#D8B4FE" />
                      <Text style={styles.cardText}>Last login: {lastLogin}</Text>
                    </View>
                    <View style={styles.inline}>
                      <Icon name="update" size={18} color="#D8B4FE" />
                      <Text style={styles.cardText}>Profile updated: {profileUpdated}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.logoutButton} onPress={handleChangePassword}>
                    <Icon name="change-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.logoutText}>Change Password</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.logoutText}>Log Out</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Voice navigation enabled</Text>
                  <Text style={styles.footerText}>Long press anywhere to give voice commands</Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default ProfileAccess;

// styles (unchanged)
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    padding: 16,
    flexGrow: 1,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  profilePic: {
    backgroundColor: 'rgba(29, 78, 216, 0.5)',
    width: 96,
    height: 96,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#D8B4FE',
    marginBottom: 12,
  },
  subtitle: {
    color: '#E9D5FF',
    fontSize: 16,
  },
  supportSection: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: '#7E22CE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'rgba(29, 78, 216, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    borderWidth: 4,
    borderColor: '#7E22CE',
  },
  cardTitle: {
    color: '#E9D5FF',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  cardText: {
    color: '#E9D5FF',
    fontSize: 14,
    marginTop: 4,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#A78BFA',
    fontSize: 12,
    marginVertical: 2,
  },
});