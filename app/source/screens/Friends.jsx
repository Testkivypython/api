import { Text, ActivityIndicator, View, FlatList, TouchableOpacity } from 'react-native'
import useGlobal from '../core/global'
import Empty from '../common/Empty'
import Cell from '../common/Cell'
import Thumbnail from '../common/Thumbnail'
import { formatTime } from '../core/utils'

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
