import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';

export function CustomSplashScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.42, 220);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
