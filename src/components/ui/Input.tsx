import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: InputProps) {
  // All hooks must be called unconditionally
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const errorColor = useThemeColor({}, 'error');
  const borderColorValue = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  
  // Use conditional logic only for values, not hooks
  const borderColor = error ? errorColor : borderColorValue;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={placeholderColor}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: errorColor }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 56,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginLeft: 16,
  },
  rightIcon: {
    marginRight: 16,
    padding: 4,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
  },
});
