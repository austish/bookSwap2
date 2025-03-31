import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}: ToastProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration - 600),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  }, [fadeAnim, duration, onClose]);

  const backgroundColor = 
    type === 'success' ? COLORS.success :
    type === 'error' ? COLORS.error : COLORS.gray;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor, opacity: fadeAnim }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  message: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: '500',
  },
});