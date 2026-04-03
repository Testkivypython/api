import * as EncryptedStorage from 'expo-secure-store';

async function set(key, value) {
    try {
        const storedValue = typeof value === 'string' ? value : JSON.stringify(value);
        await EncryptedStorage.setItem(key, storedValue);
    } catch (error) {
        console.log('secure.set:', error);
    }
}

async function get(key) {
    try {
        const data = await EncryptedStorage.getItem(key);
        if (data != undefined) {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
    } catch (error) {
        console.log('secure.get:', error);
    }
}

async function remove(key) {
    try {
        await EncryptedStorage.deleteItemAsync(key);
    } catch (error) {
        console.log('secure.remove:', error);
    }
}

async function wipe() {
    try {
        await remove('credentials');
        await remove('tokens');
        console.log('All secure storage wiped');
    } catch (error) {
        console.log('secure.wipe:', error);
    }
}

export default {
    set,
    get,
    remove,
    wipe
};
