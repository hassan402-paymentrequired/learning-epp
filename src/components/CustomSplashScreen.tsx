import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function CustomSplashScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/splash-icon.png')}
                style={styles.image}
                resizeMode="cover"
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
    image: {
        width: width,
        height: height,
    },
});
