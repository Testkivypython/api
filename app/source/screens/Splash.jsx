import { Animated, Text, StatusBar, StyleSheet, View } from 'react-native';
import Title from '../common/title';
import { useLayoutEffect, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

function SplashScreen({ navigation }) {
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [])

    const translateY = new Animated.Value(1);
    const duration = 800;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [])
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[{ transform: [{ translateY }] }]}>
                <Title text='RealtimeChat' color='white'/>    
            </Animated.View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default SplashScreen;
