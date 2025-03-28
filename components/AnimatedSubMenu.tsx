// components/AnimatedSubMenu.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface AnimatedSubMenuProps {
  visible: boolean;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  animValue: Animated.Value;
}

const AnimatedSubMenu: React.FC<AnimatedSubMenuProps> = ({
  visible,
  title,
  onBack,
  children,
  animValue,
}) => {
  return (
    <Animated.View
      style={[
        styles.container,
        visible ? styles.containerVisible : styles.containerHidden,
        {
          transform: [{ translateX: animValue }],
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevron-left" size={24} color="#000" />
            <Text style={styles.title}>{title}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

export default AnimatedSubMenu;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
  },
  containerVisible: {
    zIndex: 1,
  },
  containerHidden: {
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.screen,
    backgroundColor: COLORS.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.large,
    fontWeight: '600',
    marginLeft: SIZES.padding.small,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.screen,
    paddingTop: SIZES.padding.medium,
  },
});
