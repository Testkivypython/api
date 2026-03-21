import { useEffect, useLayoutEffect, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, InputAccessoryView, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Thumbnail from '../common/Thumbnail'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import useGlobal from '../core/global'

function MessageHeader({ friend }) {
    return(
        <View style = {{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <Thumbnail url = { friend.thumbnail } size = {30} />
            <Text style = {{
                color: '#202020',
                marginLeft: 10,
                fontSize: 18,
                fontWeight: 'bold'
            }}>
                {friend.name}
            </Text>
        </View>
    )
}

function MessageBubbleMe({ text }) {
    return (
        <View
            style = {{
                flexDirection: 'row',
                padding: 4,
                paddingRight: 12
            }}
        >
            <View style = {{ flex: 1 }} />
            <View 
                style = {{
                    backgroundColor: '#303040',
                    borderRadius: 21,
                    maxWidth: '75%',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    justifyContent: 'center',
                    marginRight: 8,
                    minHeight: 42
                }}
            >
                <Text 
                    style = {{
                        color: 'white',
                        fontSize: 16,
                        lineHeight: 18
                    }}
                >
                    {text}
                </Text>
            </View>
        </View>
    )
}

function MessageBubbleFriend({ text, friend }) {
    return (
        <View
            style = {{
                flexDirection: 'row',
                padding: 4,
                paddingLeft: 16
            }}
        >
            <Thumbnail url = { friend.thumbnail } size = {42} />
            <View 
                style = {{
                    backgroundColor: '#d0d2db',
                    borderRadius: 21,
                    maxWidth: '75%',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    justifyContent: 'center',
                    marginLeft: 8,
                    minHeight: 42
                }}
            >
                <Text 
                    style = {{
                        color: '#202020',
                        fontSize: 16,
                        lineHeight: 18
                    }}
                >
                    {text}
                </Text>
            </View>
            <View style = {{ flex: 1 }} />
        </View>
    )
}

function MessageBubble({ message, friend, index }) {
    return message.is_me ? (
        <MessageBubbleMe text = {message.text} />
    ) : (
        <MessageBubbleFriend text = {message.text} friend={friend} />
    )
}

function MessageInput({ message, setMessage, onSend }) {
    return (
        <View style = {{
            paddingHorizontal: 10,
            paddingBottom: 10,
            backgroundColor: 'white',
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <TextInput placeholder = 'Message...' placeholderTextColor = '#909090' 
                style = {{
                    flex: 1,
                    paddingHorizontal: 18,
                    borderWidth: 1,
                    borderRadius: 25,
                    borderColor: '#d0d0d0',
                    backgroundColor: 'white',
                    height: 50
                }}
                value = {message}
                onChangeText = {setMessage}
            />
            <TouchableOpacity onPress = { onSend }>
                <FontAwesomeIcon icon = 'paper-plane' size = {22} color = {'#303040'} style = {{
                    marginHorizontal: 12,
                }} />
            </TouchableOpacity>
        </View>
    )
}

function MessagesScreen({ navigation, route }) {
    const [message, setMessage] = useState('')

    const messagesList = useGlobal(state => state.messagesList)

    const messageSend = useGlobal(state => state.messageSend)
    const messageList = useGlobal(state => state.messageList)

    const connectionID = route.params.id
    const friend = route.params.friend

    // Update the header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <MessageHeader friend={friend} />
            )
        })
    }, [])

    useEffect(() => {
        messageList(connectionID)
    }, [])

    function onSend() {
        const cleaned = message.replace(/\s+/g, ' ').trim()
        console.log('onSend: ', cleaned)
        if (cleaned.length === 0) return
        messageSend(connectionID, cleaned)
        setMessage('')
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style = {{ 
                    flex: 1,
                    marginBottom: Platform.OS === 'ios' ? 60 : 0
                }}>
                    <FlatList
                        automaticallyAdjustKeyboardInsets={true}
                        contentContainerStyle = {{
                            paddingTop: 30
                        }}
                        data={messagesList}
                        inverted={true}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <MessageBubble
                                index={index}
                                message={item}
                                friend={friend}
                            />
                        )}
                    />
                </View>
            </TouchableWithoutFeedback>
            
            { 
                Platform.OS === 'ios' ? (
                    <InputAccessoryView >
                        <MessageInput 
                            message = {message}
                            setMessage = {setMessage}
                            onSend = {onSend}
                        />
                    </InputAccessoryView>
                ) : (
                    <MessageInput 
                        message = {message}
                        setMessage = {setMessage}
                        onSend = {onSend}
                    />
                )
            }
        </SafeAreaView>
    )
}

export default MessagesScreen
