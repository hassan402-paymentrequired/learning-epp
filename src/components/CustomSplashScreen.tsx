import React from "react";
import { View, StyleSheet, Image, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";

/** Must stay in sync with app.json splash.backgroundColor */
export const SPLASH_BACKGROUND = "#1E1B4B";

export function CustomSplashScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.42, 220);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={require("../assets/images/logo.png")}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
});
