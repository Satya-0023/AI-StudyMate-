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
import { Topic } from '../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Explanation() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load content');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'school';
      case 'intermediate':
        return 'layers';
      case 'advanced':
        return 'rocket';
      default:
        return 'book';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explanation</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(topic.difficulty) + '20' },
                ]}
              >
                <Ionicons
                  name={getDifficultyIcon(topic.difficulty) as any}
                  size={16}
                  color={getDifficultyColor(topic.difficulty)}
                />
                <Text
                  style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(topic.difficulty) },
                  ]}
                >
                  {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.topicTitle}>{topic.topic}</Text>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={24} color="#6366f1" />
              <Text style={styles.cardTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{topic.explanation}</Text>
          </View>

          <View style={styles.quizCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="help-circle" size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Quiz Available</Text>
            </View>
            <Text style={styles.quizDescription}>
              Test your understanding with {topic.quiz.length} questions
            </Text>
            {topic.score !== null && (
              <View style={styles.previousScoreCard}>
                <Ionicons name="trophy" size={20} color="#f59e0b" />
                <Text style={styles.previousScoreText}>
                  Previous Score: {topic.score}/{topic.quiz.length}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.startQuizButton}
              onPress={() =>
                router.push({
                  pathname: '/quiz',
                  params: { topicId: topic.id },
                })
              }
            >
              <Text style={styles.startQuizButtonText}>
                {topic.score !== null ? 'Retake Quiz' : 'Start Quiz'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  content: {
    padding: 20,
  },
  topicCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topicHeader: {
    marginBottom: 12,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  explanationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  quizCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quizDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  previousScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previousScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 8,
  },
  startQuizButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
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
});
