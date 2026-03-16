import { Text, TouchableOpacity, StyleSheet } from 'react-native'

function Button({ title, onPress }) {
    return(
        <TouchableOpacity style = {styles.button} onPress = {onPress}>
            <Text style = {styles.buttonText}>{ title }</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#202020',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fonrWeight: 'bold'
    }
})

export default Button
