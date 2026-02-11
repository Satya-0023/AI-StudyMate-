import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const difficulties = [
    { value: 'beginner', label: 'Beginner', icon: 'school', color: '#10b981' },
    { value: 'intermediate', label: 'Intermediate', icon: 'layers', color: '#f59e0b' },
    { value: 'advanced', label: 'Advanced', icon: 'rocket', color: '#ef4444' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/topics/generate', {
        topic: topic.trim(),
        difficulty,
      });

      // Navigate to explanation screen with the generated content
      router.push({
        pathname: '/explanation',
        params: { topicId: response.data.id },
      });
      
      setTopic(''); // Clear input after successful generation
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="school" size={48} color="#6366f1" />
            <Text style={styles.title}>AI StudyMate</Text>
            <Text style={styles.subtitle}>Learn anything with AI assistance</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What do you want to learn?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Deadlock in Operating Systems"
                placeholderTextColor="#64748b"
                value={topic}
                onChangeText={setTopic}
                multiline
                numberOfLines={3}
              />
            </View>

            <Text style={styles.difficultyLabel}>Select Difficulty Level</Text>
            <View style={styles.difficultyContainer}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.value}
                  style={[
                    styles.difficultyButton,
                    difficulty === diff.value && styles.difficultyButtonActive,
                    { borderColor: diff.color },
                    difficulty === diff.value && { backgroundColor: diff.color + '20' },
                  ]}
                  onPress={() => setDifficulty(diff.value as any)}
                >
                  <Ionicons
                    name={diff.icon as any}
                    size={24}
                    color={difficulty === diff.value ? diff.color : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === diff.value && { color: diff.color },
                    ]}
                  >
                    {diff.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.generateButton, loading && styles.buttonDisabled]}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="bulb" size={24} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Content</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#6366f1" />
            <Text style={styles.infoText}>
              Enter any topic you want to learn, and AI will generate a personalized explanation
              and quiz questions based on your selected difficulty level.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  input: {
    padding: 16,
    color: '#f1f5f9',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  difficultyButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
    backgroundColor: '#0f172a',
  },
  difficultyButtonActive: {
    borderWidth: 2,
  },
  difficultyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
});
