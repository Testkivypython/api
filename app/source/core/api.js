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

// Add request interceptor to include auth token
API.interceptors.request.use(
    async (config) => {
        const tokens = await secure.get('tokens')
        // Skip token for signin/signup endpoints
        const isAuthEndpoint = config.url?.includes('/signin/') || config.url?.includes('/signup/')
        if (tokens?.access && !isAuthEndpoint) {
            config.headers.Authorization = `Bearer ${tokens.access}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Add response interceptor for debugging
API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('API Error - status:', error.response?.status)
        console.log('API Error - data:', error.response?.data)
        return Promise.reject(error)
    }
)

export default API
