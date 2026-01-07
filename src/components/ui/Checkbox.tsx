import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
}

export function Checkbox({ checked, onPress, label }: CheckboxProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? tintColor : borderColor,
            backgroundColor: checked ? tintColor : 'transparent',
          },
        ]}
      >
        {checked && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
  },
});
