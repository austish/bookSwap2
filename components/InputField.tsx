// components/InputField.tsx
import React from 'react';
import {View, TextInput, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface InputFieldProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  togglePassword?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPassword,
  togglePassword,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  onFocus,
  onBlur,
}) => {
  return (
    <View
      style={[
        styles.inputContainer,
        !editable && styles.inputContainerDisabled,
      ]}>
      <Icon
        name={icon}
        size={24}
        color={COLORS.primary}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {togglePassword && (
        <Pressable
          onPress={togglePassword}
          style={styles.eyeIcon}
          disabled={!editable}>
          <Icon
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={COLORS.secondary}
          />
        </Pressable>
      )}
    </View>
  );
};

export default InputField;


const styles = StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderRadius: SIZES.borderRadius.input,
      marginBottom: SIZES.spacing.vertical.medium,
      paddingHorizontal: SIZES.padding.medium,
      ...SIZES.shadow.small,
    },
    inputContainerDisabled: {
      opacity: 0.7,
    },
    inputIcon: {
      marginRight: SIZES.padding.small,
    },
    input: {
      flex: 1,
      height: SIZES.height.input,
      fontSize: SIZES.fontSize.medium,
    },
    eyeIcon: {
      padding: SIZES.padding.small,
    },
  });