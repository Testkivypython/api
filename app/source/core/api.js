import axios from 'axios'
import { Platform } from 'react-native'
import secure from './secure'

//export const ADDRESS = Platform.OS === 'ios' ? 'localhost:8000' : '10.0.2.2:8000'
export const ADDRESS = 'poiink.online'

const API = axios.create({
    baseURL: 'https://' + ADDRESS,
    headers: {
        'Content-Type': 'application/json',
    }
})


export default API
