import { Text, ActivityIndicator, View, FlatList, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import useGlobal from '../core/global'
import Empty from '../common/Empty'
import Cell from '../common/Cell'
import Thumbnail from '../common/Thumbnail'
import utils from '../core/utils'

function RequestAccept({ item }) {
    const requestAccept = useGlobal(state => state.requestAccept)

    return (
        <TouchableOpacity
            style = {{
                backgroundColor: '#202020',
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onPress = {() => {
                requestAccept(item.sender.username)
            }}
        >
            <Text style = {{ color: 'white', fontWeight: 'bold' }}>Accept</Text>
        </TouchableOpacity>
    )
}


function RequestRow({ item, refreshKey }) {
    const message = 'Requested to connect with you'

    return (
        <Cell>
            <Thumbnail url={item.sender.thumbnail} size= {76} refreshKey={refreshKey} />
            <View style = {{ flex: 1, paddingHorizontal: 16 }}>
                <Text style = {{ fontWeight: 'bold', color: '#202020', marginBottom: 4 }}>{item.sender.name}</Text>
                <Text style = {{ color: '#606060' }}>{message} <Text style = {{ color: '#909090', fontSize: 13 }}>{utils.formatTime(item.created)}</Text></Text>
            </View>
            <RequestAccept item={item} />
        </Cell>
    )
}

function RequestsScreen() {
    const requestsList = useGlobal((state) => state.requestList)
    const thumbnailTimestamps = useGlobal(state => state.thumbnailTimestamps)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        if (thumbnailTimestamps && Object.keys(thumbnailTimestamps).length > 0) {
            setRefreshKey(k => k + 1)
        }
    }, [thumbnailTimestamps])

    // Show loading indicator
    if (requestsList === null) {
        return (
            <ActivityIndicator style = {{ flex: 1 }} />
        )
    }

    // show empty requestsList
    if (requestsList.length === 0) {
        return (
            <Empty icon = 'bell' message = 'No requests' />
        )   
    }

    // show requestsList
    return (
        <View style = {{ flex: 1 }}>
            <FlatList
                data={requestsList}
                renderItem={({ item }) => (
                    <RequestRow item={item} refreshKey={refreshKey} />
                )}
                keyExtractor={(item) => item.sender.username}
            />
        </View>
    )
}
    
export default RequestsScreen
