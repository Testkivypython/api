import { Text, ActivityIndicator, View, FlatList, TouchableOpacity } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import useGlobal from '../core/global'
import Empty from '../common/Empty'
import Cell from '../common/Cell'
import Thumbnail from '../common/Thumbnail'
import utils from '../core/utils'

function FriendRow({ navigation, item, refreshKey }) {
    return (
        <TouchableOpacity onPress = {() => navigation.navigate('Message', item)}>
            <Cell>
                <Thumbnail url={item.friend.thumbnail} size= {76} refreshKey={refreshKey} />
                <View style = {{ flex: 1, paddingHorizontal: 16 }}>
                    <Text style = {{ fontWeight: 'bold', color: '#202020', marginBottom: 4 }}>{item.friend.name}</Text>
                    <Text style = {{ color: '#606060' }}>{item.preview} <Text style = {{ color: '#909090', fontSize: 13 }}>{utils.formatTime(item.updated)}</Text></Text>
                </View>
            </Cell>
        </TouchableOpacity>
    )
}

function FriendsScreen({ navigation }) {
    const friendList = useGlobal((state) => state.friendList)
    const thumbnailTimestamps = useGlobal((state) => state.thumbnailTimestamps)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        if (thumbnailTimestamps && Object.keys(thumbnailTimestamps).length > 0) {
            setRefreshKey(k => k + 1)
        }
    }, [thumbnailTimestamps])
               
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

    return (
        <View style = {{ flex: 1 }}>
            <FlatList
                data={friendList}
                renderItem={({ item }) => (
                    <FriendRow 
                        navigation={navigation} 
                        item={item} 
                        refreshKey={refreshKey}
                    />
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    )

}

export default FriendsScreen
