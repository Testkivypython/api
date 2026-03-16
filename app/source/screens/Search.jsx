import { TextInput, View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useState, useEffect } from 'react'
import Empty from '../common/Empty'
import useGlobal from '../core/global'
import Thumbnail from '../common/Thumbnail'
import Cell from '../common/Cell'

function SearchButton({ user }) {
    if (user.status === 'connected') {
        return (
            <FontAwesomeIcon
                icon = 'circle-check'
                size={30}
                color='#20d080'
                style = {{ marginRight: 10 }}
            />
        )
    }

    const requestConnect = useGlobal(state => state.requestConnect)
    const requestAccept = useGlobal(state => state.requestAccept)

    const data = {}
    
    switch (user.status) {
        case 'no-connection':
            data.text = 'Connect'
            data.disabled = false
            data.onPress = () => {
                requestConnect(user.username)
            }
            break
        case 'pending-them':
            data.text = 'Pending'
            data.disabled = true
            data.onPress = () => {}
            break
        case 'pending-me':
            data.text = 'Accept'
            data.disabled = false
            data.onPress = () => {
                requestAccept(user.username)
            }
            break
        default: break
    }

    return (
        <TouchableOpacity 
            style = {{
                backgroundColor: data.disabled ? '#505055' : '#202020',
                paddingHorizontal: 14,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18
            }} 
            onPress = {data.onPress}
            disabled = {data.disabled}
        >
            <Text style = {{ color: data.disabled ? '#808080' : 'white', fontWeight: 'bold' }}>{data.text}</Text>
        </TouchableOpacity>
    )
}

function SearchRow({ user }) {
    return (
        <Cell>
            <Thumbnail url={user.thumbnail} size= {76} />
            <View style = {{ flex: 1, paddingHorizontal: 16 }}>
                <Text style = {{ fontWeight: 'bold', color: '#202020', marginBottom: 4 }}>{user.name}</Text>
                <Text style = {{ color: '#606060' }}>{user.username}</Text>
            </View>
            <SearchButton user={user} />
        </Cell>
    )
}

function SearchScreen() {
    const [query, setQuery] = useState('')
    
    const searchList = useGlobal(state => state.searchList)
    const searchUsers = useGlobal(state => state.searchUsers)

    useEffect(() => {
        searchUsers(query)
    }, [query])

    /* const searchList = [
        {
            thumbnail: null,
            name: 'Silly Name',
            username: 'sillyname',
            status: 'pending-them'
        },
        {
            thumbnail: null,
            name: 'Silly Red',
            username: 'sillya',
            status: 'pending-me'
        },
        {
            thumbnail: null,
            name: 'Silly Blue',
            username: 'sillyb',
            status: 'connected'
        },
        {
            thumbnail: null,
            name: 'Silly Green',
            username: 'sillyc',
            status: 'no-connection'
        }
    ]*/

    return (
        <SafeAreaView style = {{flex: 1}}>
            <View style={styles.container}>
                <View>
                    <TextInput style = {styles.input} value = {query} onChangeText = {setQuery}/>
                    <FontAwesomeIcon 
                        icon='magnifying-glass' 
                        style = {{ 
                            position: 'absolute', 
                            left: 18, 
                            top: 17 
                        }} 
                        color="#505050" size={20} 
                    />
                </View>
            </View>
            
            {searchList === null ? (
                <Empty
                    icon = 'magnifying-glass'
                    message = 'Search for friends'
                    centered = {false}
                />
            ) : searchList.length === 0 ? (
                <Empty 
                    icon='triangle-exclamation' 
                    message={'No users found for "' + query + '"'}
                    centered = {false}
                /> 
            ) : (
                <FlatList
                    data={searchList}
                    renderItem={({ item }) => (
                        <SearchRow user={item} />
                    )}
                    keyExtractor={item => (item.username)}
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingTop: 0,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0'
    },
    input: {
        height: 52,
        borderRadius: 26,
        padding: 16,
        backgroundColor: '#e1e2e4',
        fontSize: 16,
        paddingLeft: 50
    }
})

export default SearchScreen
