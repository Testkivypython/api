import * as EncryptedStorage from 'expo-secure-store';

async function set(key, object) {
    try {
        await EncryptedStorage.setItem(key, JSON.stringify(object))
    } catch (error) {
        console.log('secure.set:', error)
    }
}

async function get(key) {
    try {
        const data = await EncryptedStorage.getItem(key)
        if (data != undefined) {
            return JSON.parse(data)
        }
    } catch (error) {
        console.log('secure.get:', error)
    }
}

async function remove(key) {
    try {
        await EncryptedStorage.deleteItemAsync(key)
    } catch (error) {
        console.log('secure.remove:', error)
    }
}

async function wipe() {
    try {
        await remove('credentials')
        await remove('tokens')
    } catch (error) {
        console.log('secure.wipe:', error)
    }
}

export default {
    set,
    get,
    remove,
    wipe
}
