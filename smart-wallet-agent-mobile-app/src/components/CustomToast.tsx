// components/CustomToast.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { useTheme } from '../providers/ThemeProvider';
import { Feather } from '@expo/vector-icons';

export default function CustomToast(props: BaseToastProps) {
  const { text1, text2, onPress } = props;
  const { theme, colors } = useTheme();
  const type = (props as any)?.type as string | undefined;
  
  const isDark = theme === 'dark';
  const isError = type === 'error';
  const isSuccess = type === 'success';

  const backgroundColor = colors.surface;
  const textColor = colors.text;
  const subTextColor = colors.textSecondary;
  const borderColor = colors.border;

  let statusColor = colors.primary;
  let iconName: keyof typeof Feather.glyphMap = 'info';
  let defaultTitle = 'Information';

  if (isSuccess) {
    statusColor = colors.primary;
    iconName = 'check-circle';
    defaultTitle = 'Success';
  } else if (isError) {
    statusColor = colors.error;
    iconName = 'alert-circle';
    defaultTitle = 'Error';
  }

  const title = text1 ?? defaultTitle;
  const message = text2 ?? (text1 ? null : '');

  return (
    <TouchableOpacity 
      activeOpacity={0.95} 
      onPress={onPress} 
      style={[
        styles.container, 
        { backgroundColor, borderColor },
        {
          shadowColor: isDark ? colors.primary : colors.secondary,
          shadowOpacity: isDark ? 0.1 : 0.06,
          shadowRadius: isDark ? 10 : 8,
          elevation: isDark ? 4 : 3,
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Feather name={iconName} size={22} color={statusColor} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {title}
        </Text>
        {message ? (
          <Text style={[styles.message, { color: subTextColor }]}>
            {message}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingRight: 16,
    marginTop: 10,
    width: '90%',
    alignSelf: 'center',
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
});