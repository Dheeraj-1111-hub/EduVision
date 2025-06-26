import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Vibration,
  PanResponder,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import axios from 'axios';
import Navbar from '../../components/NavBar';
import { useRouter } from 'expo-router';

const GROQ_API_KEY = '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';

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
};

const QuizQuestions = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();

  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 100) {
        // Swipe right → Go to Library
        router.push('/navigation/screens/Library');
      } else if (gestureState.dx < -100) {
        // Swipe left → Go to Profile
        router.push('/navigation/screens/Profile');
      }
    },
  });

  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      try {
        const quizDataString = await AsyncStorage.getItem('quizData');
        const parsed: QuizQuestion[] = JSON.parse(quizDataString || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          speakOutQuestion(parsed[0]);
        }
      } catch (err) {
        console.error('Failed to load quizData', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, []);

  const speakOutQuestion = (questionObj: QuizQuestion) => {
    const spokenText = `Question: ${questionObj.question}. Options are: ${questionObj.options
      .map((opt, i) => `Option ${i + 1}: ${opt}`)
      .join('. ')}. Long press and hold anywhere to answer.`;
    Speech.speak(spokenText);
  };

  const transcribeWithGroq = async (fileUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as any);
    formData.append('model', 'whisper-large-v3');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.text;
  };

  const handleOptionPress = (index: number) => {
    setSelectedOption(index);
    Vibration.vibrate(100);
    const isCorrect = index === questions[currentQuestion].correct;
    const feedback = isCorrect ? 'Correct answer, great job!' : 'Wrong answer, please try again.';
    Speech.speak(feedback, {
      onDone: () => {
        if (isCorrect) {
          handleNext();
        }
      },
    });
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
      setIsRecording(true);
      Vibration.vibrate(50);
      Speech.speak('Recording started. Please say your answer.');
    } catch (err) {
      console.error('Failed to start recording', err);
      Speech.speak('Recording could not be started.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      if (!isRecording || !recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      Vibration.vibrate(100);
      Speech.speak('Recording stopped. Processing your answer...');
      const text = await transcribeWithGroq(uri);
      console.log('Transcript:', text);

      const numberMap: { [key: string]: number } = {
        one: 0, '1': 0,
        two: 1, '2': 1,
        three: 2, '3': 2,
        four: 3, '4': 3,
      };

      const lowerText = text.toLowerCase();
      const selected = Object.entries(numberMap).find(([key]) =>
        lowerText.includes(key)
      );

      if (selected) {
        handleOptionPress(selected[1]);
      } else {
        Speech.speak("Sorry, I couldn't understand your answer. Please try again.");
      }
    } catch (err) {
      console.error('Transcription failed', err);
      Speech.speak('There was an error processing your answer.');
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setSelectedOption(null);
      speakOutQuestion(questions[next]);
    } else {
      Speech.speak('You have reached the end of the quiz.');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prev = currentQuestion - 1;
      setCurrentQuestion(prev);
      setSelectedOption(null);
      speakOutQuestion(questions[prev]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading quiz...</Text>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white', textAlign: 'center', paddingHorizontal: 20 }}>
          No quiz available. Please upload a PDF from the Home tab first.
        </Text>
      </View>
    );
  }

  const question = questions[currentQuestion];

  return (
    <TouchableWithoutFeedback
      onPressIn={startRecording}
      onPressOut={stopRecordingAndTranscribe}
      accessible={true}
    >
      <Animated.View style={styles.container} {...panResponder.panHandlers}>
        <Navbar />

        <Text style={styles.heading}>Quiz (Audio-Based)</Text>
        <View style={styles.quizContainer}>
          <Text style={styles.description}>Hold anywhere to speak your answer. Release to stop.</Text>
          <View style={styles.questionBox}>
            <Text style={styles.questionHeading}>Question {currentQuestion + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            <View style={styles.optionsContainer}>
              {question.options.map((option: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.option,
                    selectedOption === index &&
                    (index === question.correct ? styles.correctOption : styles.wrongOption),
                  ]}
                >
                  <Text style={styles.optionText}>
                    {index + 1}. {option}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableWithoutFeedback onPress={handlePrevious}>
              <View style={styles.navButton}>
                <Text style={styles.navButtonText}>◀ Previous</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={handleNext}>
              <View style={styles.navButton}>
                <Text style={styles.navButtonText}>Next ▶</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  heading: { fontSize: 22, fontWeight: '600', color: 'white', textAlign: 'center', marginBottom: 10, marginTop: 40 },
  quizContainer: { backgroundColor: '#611BF8', padding: 20, borderRadius: 15 , marginHorizontal:20},
  description: { color: '#cbd5e0', textAlign: 'center', marginBottom: 10 },
  questionBox: { backgroundColor: '#1a202c', padding: 15, borderRadius: 10 },
  questionHeading: { fontWeight: '500', color: '#ffffff' },
  questionText: { fontSize: 14, color: '#cbd5e0', marginBottom: 10 },
  optionsContainer: { marginBottom: 15 },
  option: { padding: 10, borderRadius: 8, backgroundColor: '#2d3748', marginVertical: 5 },
  optionText: { color: '#ffffff' },
  correctOption: { backgroundColor: '#38a169' },
  wrongOption: { backgroundColor: '#e53e3e' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  navButton: { backgroundColor: 'black', padding: 10, borderRadius: 8 },
  navButtonText: { color: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
});

export default QuizQuestions;
