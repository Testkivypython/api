import { Text, ActivityIndicator, View, FlatList, TouchableOpacity } from 'react-native'
import useGlobal from '../core/global'
import Empty from '../common/Empty'
import Cell from '../common/Cell'
import Thumbnail from '../common/Thumbnail'

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

function FriendRow({ navigation, item }) {
    return (
        <TouchableOpacity onPress = {() => navigation.navigate('Message', item)}>
            <Cell>
                <Thumbnail url={item.friend.thumbnail} size= {76} />
                <View style = {{ flex: 1, paddingHorizontal: 16 }}>
                    <Text style = {{ fontWeight: 'bold', color: '#202020', marginBottom: 4 }}>{item.friend.name}</Text>
                    <Text style = {{ color: '#606060' }}>{item.preview} <Text style = {{ color: '#909090', fontSize: 13 }}>{formatTime(item.updated)}</Text></Text>
                </View>
            </Cell>
        </TouchableOpacity>
    )
}

function FriendsScreen({ navigation }) {
    const friendList = useGlobal((state) => state.friendList)
               
    // Show loading indicator
    if (friendList === null) {
        return (
            <ActivityIndicator style = {{ flex: 1 }} />
        )
    }

    // show empty friendList
    if (friendList.length === 0) {
        return (
            <Empty icon = 'users' message = 'No friends yet' />
        )   
    }

    // show friendList
    return (
        <View style = {{ flex: 1 }}>
            <FlatList
                data={friendList}
                renderItem={({ item }) => (
                    <FriendRow navigation={navigation} item={item} />
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    )

}

export default FriendsScreen
