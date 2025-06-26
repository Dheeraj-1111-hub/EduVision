import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';

interface QuizProps {
  quizData: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
}

const QuizQuestions: React.FC<QuizProps> = ({ quizData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!quizData || quizData.length === 0) {
      Speech.speak("No quiz available. Please upload a PDF in the Home tab first.");
    } else {
      Speech.speak("Quiz loaded. Swipe left or right to navigate tabs. Double tap to choose an option.");
    }
  }, [quizData]);

  const handleOptionPress = (index: number) => {
    setSelectedOption(index);
    setShowExplanation(true);
    const isCorrect = index === quizData[currentQuestion].correct;
    Speech.speak(
      isCorrect
        ? 'Correct answer.'
        : `Wrong answer. ${quizData[currentQuestion].explanation}`
    );
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      Speech.speak(`Question ${currentQuestion + 2}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
      setShowExplanation(false);
      Speech.speak(`Question ${currentQuestion}`);
    }
  };

  if (!quizData || quizData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white', textAlign: 'center', paddingHorizontal: 20 }}>
          No quiz available. Please upload a PDF from the Home tab first.
        </Text>
      </View>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quiz & Questions</Text>
      <View style={styles.quizContainer}>
        <Text style={styles.description}>Test your knowledge with these questions.</Text>
        <View style={styles.questionBox}>
          <Text style={styles.questionHeading}>Question {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.optionsContainer}>
            {question.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  selectedOption === index &&
                    (index === question.correct ? styles.correctOption : styles.wrongOption),
                ]}
                onPress={() => handleOptionPress(index)}
              >
                <View style={styles.radioOuter}>
                  {selectedOption === index && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {showExplanation && (
            <Text style={styles.explanationText}>{question.explanation}</Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>◀ Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>Next ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (unchanged styling)
  container: { padding: 20 },
  heading: {
    fontSize: 25,
    fontWeight: '600',
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  quizContainer: {
    backgroundColor: '#611BF8',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4a5568',
    marginTop: 20,
  },
  description: { color: '#cbd5e0', marginBottom: 15, textAlign: 'center' },
  questionBox: {
    backgroundColor: '#1a202c',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  questionHeading: { fontWeight: '500', marginBottom: 10, color: '#ffffff' },
  questionText: { fontSize: 14, color: '#cbd5e0', marginBottom: 10 },
  optionsContainer: { marginBottom: 15 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2d3748',
    marginVertical: 5,
  },
  correctOption: { backgroundColor: '#38a169' },
  wrongOption: { backgroundColor: '#e53e3e' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#611BF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#63b3ed',
  },
  optionText: { color: '#ffffff', fontSize: 14 },
  explanationText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  navButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  navButtonText: { color: '#ffffff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});

export default QuizQuestions;
