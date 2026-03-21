import { Platform } from 'react-native'
import ProfileImage from '../../assets/profile.jpg'
import { ADDRESS } from './api'

function log(){
    for (let i = 0; i < arguments.length; i++) {
        let arg = arguments[i];
        
        if (typeof arg === 'object') {
            arg = JSON.stringify(arg, null, 2);
        }

        console.log(`[${Platform.OS}]`, arg);
    }
}

function thumbnail(url){
    if (!url){
        return ProfileImage;
    }
    return {
        uri: 'http://' + ADDRESS + url
    }
}

function formatTime(date) {
    if (date == null) {
        return '-'
    }

    const now = new Date()
    const s = Math.abs(now - new Date(date)) / 1000

    // less than a minute
    if (s < 60) {
        return 'just now'
    }
    // Minutes
    if (s < 60 * 60) {
        const m = Math.floor(s / 60)
        return `${m}m ago`
    }
    // Hours
    if (s < 60 * 60 * 24) {
        const h = Math.floor(s / 60 / 60)
        return `${h}h ago`
    }
    // Days
    if (s < 60 * 60 * 24 * 30) {
        const d = Math.floor(s / 60 / 60 / 24)
        return `${d}d ago`
    }
    // Weeks
    if (s < 60 * 60 * 24 * 30 * 4) {
        const w = Math.floor(s / 60 / 60 / 24 / 7)
        return `${w}w ago`
    }
    // Years
    const y = Math.floor(s / 60 / 60 / 24 / 365)
    return `${y}y ago`
}

export default {
    log,
    thumbnail,
    formatTime
}
