import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react'
import useGlobal from '../core/global'
import utils from '../core/utils'
import Thumbnail from '../common/Thumbnail'

const handleImagePress = async ( uploadThumbnail ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        alert('Нужно разрешение на доступ к галерее');
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
    });

    if (!result.canceled) {
        utils.log('ImagePicker result', result);
        const file = result.assets[0];
        uploadThumbnail(file)
    }
};

function ProfileImage() {
    const uploadThumbnail = useGlobal(state => state.uploadThumbnail)
    const user = useGlobal(state => state.user)
    const thumbnailTimestamps = useGlobal(state => state.thumbnailTimestamps)
    const [refreshKey, setRefreshKey] = useState(0)
    
    useEffect(() => {
        if (thumbnailTimestamps && Object.keys(thumbnailTimestamps).length > 0) {
            setRefreshKey(k => k + 1)
        }
    }, [thumbnailTimestamps])

    return (
        <TouchableOpacity style = {styles.buttonImage} onPress = {() => handleImagePress(uploadThumbnail)}>
            <Thumbnail url={user.thumbnail} size={180} refreshKey={refreshKey} />
            <View style = {styles.editImage}>
                <FontAwesomeIcon icon='pencil' color="#d0d0d0" size={15} />
            </View>
        </TouchableOpacity>
    )
}

function ProfileLogout() {
    const logout = useGlobal(state => state.logout)

    return (
        <TouchableOpacity style = {styles.logout} onPress = {logout}> 
            <FontAwesomeIcon icon='right-from-bracket' style = {{ marginRight: 12 }} color="#d0d0d0" size={20} />
            <Text style = {styles.logoutText}>Logout</Text>
        </TouchableOpacity>
    )
}

function ProfileScreen() {
    const user = useGlobal(state => state.user)
    return ( 
        <View style={styles.container}>
            <ProfileImage />
            <Text style = {styles.name}>{user.name}</Text>
            <Text style = {styles.username}>@{user.username}</Text>
        
            <ProfileLogout />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100
    }, 
    editImage: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#202020',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonImage: {
        marginBottom: 20
    },
    name: {
        textAlign: 'center',
        color: '#303030',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6
    },
    username: {
        textAlign: 'center',
        color: '#606060',
        fontSize: 14
    },
    logout: {
        flexDirection: 'row',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 26,
        backgroundColor: '#202020',
        marginTop: 25
    },
    logoutText: {
        fontWeight: 'bold',
        color: '#d0d0d0'
    },
})

export default ProfileScreen
