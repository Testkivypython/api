import { Text, StyleSheet } from 'react-native';

function Title({text, color}) {
    return (
        <Text style={{
            fontSize: 48,
            color: color,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 25
        }}>
            {text}
        </Text>
    )
}

export default Title;
