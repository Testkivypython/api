import { Image } from 'react-native'
import { ADDRESS } from '../core/api'
import ProfileImage from '../../assets/profile.jpg'

function Thumbnail({ url, size, refreshKey }) {
    let source
    if (!url) {
        source = ProfileImage
    } else {
        const ts = refreshKey ? `&t=${refreshKey}` : ''
        const uri = 'https://' + ADDRESS + url + '?v=1' + ts
        source = { uri }
    }
    return (    
        <Image key={refreshKey} style = {{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#c0c0c0' }} source = {source} />
    )
}

export default Thumbnail
