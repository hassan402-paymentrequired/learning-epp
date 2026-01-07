import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
}

const slides: OnboardingSlide[] = [
  {
    title: 'Welcome to Exam Prep',
    description: 'Your comprehensive platform for JAMB and UNILAG exam preparation. Practice with thousands of questions and track your progress.',
    icon: '🎓',
  },
  {
    title: 'Practice Anytime',
    description: 'Access practice exams and past questions on the go. Study at your own pace with detailed explanations for every answer.',
    icon: '📚',
  },
  {
    title: 'Track Your Progress',
    description: 'Monitor your performance with detailed analytics. Identify your strengths and areas for improvement.',
    icon: '📊',
  },
];

export function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const { setHasSeenOnboarding } = useAuth();

  const handleFinish = async () => {
    await setHasSeenOnboarding(true);
    navigation.navigate('Auth' as never, { screen: 'Login' } as never);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {currentIndex < slides.length - 1 && (
          <ThemedText
            type="link"
            onPress={handleSkip}
            style={styles.skipButton}
          >
            Skip
          </ThemedText>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.content}>
              <ThemedText style={styles.icon}>{slide.icon}</ThemedText>
              <ThemedText type="title" style={styles.title}>
                {slide.title}
              </ThemedText>
              <ThemedText style={styles.description}>
                {slide.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        <Button
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    fontSize: 16,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#0a7ea4',
  },
  button: {
    width: '100%',
  },
});
