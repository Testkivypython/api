import { Image } from 'react-native'
import utils from '../core/utils'

function Thumbnail({ url, size }) {
    return (    
        <Image style = {{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#c0c0c0' }} source = {utils.thumbnail(url)} />
    )
}

export default Thumbnail
