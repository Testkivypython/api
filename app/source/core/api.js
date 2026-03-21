import axios from 'axios'
import { Platform } from 'react-native'

//export const ADDRESS = Platform.OS === 'ios' ? 'localhost:8000' : '10.0.2.2:8000'
export const ADDRESS = '80.93.52.199'

const API = axios.create({
    baseURL: 'http://' + ADDRESS,
    headers: {
        'Content-Type': 'application/json',
    }
})

export default API
