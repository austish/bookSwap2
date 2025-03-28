// components/DropDown.tsx
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, LayoutAnimation} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {StyleSheet} from 'react-native';
import {COLORS, SIZES} from '@/constants/theme';

interface DropDownProps {
  title: string;
  content: {
    numberedSteps?: {
      number: number;
      text: string;
    }[];
    additionalInfo?: string;
  };
}

const NumberCircle = ({number}: {number: number}) => (
  <View style={styles.numberCircle}>
    <Text style={styles.numberText}>{number}</Text>
  </View>
);

const DropDown: React.FC<DropDownProps> = ({title, content}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.gray}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {content.numberedSteps?.map(step => (
            <View key={step.number} style={styles.stepContainer}>
              <NumberCircle number={step.number} />
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
          {content.additionalInfo && (
            <Text style={styles.additionalInfo}>{content.additionalInfo}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default DropDown;

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding.medium,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.small,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding.medium,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: '600',
    color: COLORS.black,
  },
  content: {
    padding: SIZES.padding.medium,
    backgroundColor: COLORS.lightGray + '20',
  },
  contentText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    lineHeight: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    lineHeight: 24,
  },
  additionalInfo: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    lineHeight: 24,
    marginTop: 8,
    marginLeft: 40, // Aligns with the text after number circles
  },
});
