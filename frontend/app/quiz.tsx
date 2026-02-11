import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/utils/api';
import { Topic, QuizResult } from '../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Quiz() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const response = await api.get(`/api/topics/${topicId}`);
      setTopic(response.data);
      setSelectedAnswers(new Array(response.data.quiz.length).fill(''));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (topic?.quiz.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedAnswers.some((answer) => !answer)) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/topics/submit-quiz', {
        topic_id: topicId,
        answers: selectedAnswers,
      });
      setResult(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.push('/(tabs)/history');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return null;
  }

  if (result) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.resultContent}>
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.resultIcon,
                  { backgroundColor: result.passed ? '#10b98120' : '#ef444420' },
                ]}
              >
                <Ionicons
                  name={result.passed ? 'trophy' : 'close-circle'}
                  size={64}
                  color={result.passed ? '#10b981' : '#ef4444'}
                />
              </View>
              <Text style={styles.resultTitle}>
                {result.passed ? 'Congratulations!' : 'Keep Learning!'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.passed
                  ? 'You passed the quiz!'
                  : 'Review the material and try again'}
              </Text>

              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                <Text style={styles.scoreValue}>
                  {result.score}/{result.total}
                </Text>
                <Text style={styles.percentageValue}>{result.percentage.toFixed(0)}%</Text>
              </View>

              <View style={styles.resultDetails}>
                <View style={styles.resultDetailItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.resultDetailText}>Correct: {result.score}</Text>
                </View>
                <View style={styles.resultDetailItem}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                  <Text style={styles.resultDetailText}>Wrong: {result.total - result.score}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <Text style={styles.finishButtonText}>View History</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  setResult(null);
                  setCurrentQuestion(0);
                  setSelectedAnswers(new Array(topic.quiz.length).fill(''));
                }}
              >
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.retakeButtonText}>Retake Quiz</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const question = topic.quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / topic.quiz.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.questionProgress}>
            {currentQuestion + 1}/{topic.quiz.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === option;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleSelectAnswer(option)}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      isSelected && styles.optionRadioSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestion === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={currentQuestion === 0 ? '#64748b' : '#f1f5f9'}
            />
            <Text
              style={[
                styles.navButtonText,
                currentQuestion === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {currentQuestion === topic.quiz.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Quiz</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#f1f5f9" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  content: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  optionButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#6366f1',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#cbd5e1',
  },
  optionTextSelected: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#64748b',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  percentageValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 8,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#0f172a',
    borderRadius: 12,
  },
  resultDetailItem: {
    alignItems: 'center',
  },
  resultDetailText: {
    fontSize: 14,
    color: '#f1f5f9',
    marginTop: 8,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  retakeButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
