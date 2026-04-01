import { use, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, InputAccessoryView, FlatList, KeyboardAvoidingView, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Thumbnail from '../common/Thumbnail'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import useGlobal from '../core/global'
import crypto from '../core/crypto'

function MessageHeader({ friend, refreshKey }) {
    return(
        <View style = {{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <Thumbnail url = { friend.thumbnail } size = {30} refreshKey={refreshKey} />
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

function MessageTypingAnimation({ offset }) {
    const y = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const total = 1000
        const bump = 200

        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(offset * bump),
                Animated.timing(y, {
                    toValue: 1,
                    duration: bump,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(y, {
                    toValue: 0,
                    duration: bump,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.delay(total - bump * 2 - offset * bump)
            ])
        )
        animation.start()
        return () => {
            animation.stop()
        }
    }, [])

    const translateY = y.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8]
    })

    return (
        <Animated.View style = {{
            width: 8,
            height: 8,
            marginHorizontal: 1.5,
            borderRadius: 4,
            backgroundColor: '#606060',
            transform: [{ translateY }]
        }} />
    )
}


function MessageBubbleFriend({ text='', friend, typing=false, refreshKey }) {
    return (
        <View
            style = {{
                flexDirection: 'row',
                padding: 4,
                paddingLeft: 16
            }}
        >
            <Thumbnail url = { friend.thumbnail } size = {42} refreshKey={refreshKey} />
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
                {typing ? (
                    <View style={{ flexDirection: 'row' }}>
                        <MessageTypingAnimation offset={0} />
                        <MessageTypingAnimation offset={1} />
                        <MessageTypingAnimation offset={2} />
                    </View>
                ) : (
                    <Text 
                        style = {{
                            color: '#202020',
                            fontSize: 16,
                            lineHeight: 18
                        }}
                    >
                        {text}
                    </Text>
                )}
                
            </View>
            <View style = {{ flex: 1 }} />
        </View>
    )
}

function MessageBubble({ message, friend, index, refreshKey }) {
    const [showTyping, setShowTyping] = useState(false)
    const [decryptedText, setDecryptedText] = useState('')
    const [isDecrypting, setIsDecrypting] = useState(false);

    const messagesTyping = useGlobal(state => state.messagesTyping)

    useEffect(() => {
        async function decryptMessage() {
            if (index === 0) return;
            if (message.is_me) {
                setDecryptedText(message.text);
                return;
            }
            
            setIsDecrypting(true);
            
            const chatKeys = useGlobal.getState().chatKeys;
            const aesKey = chatKeys[connectionID];
            
            if (aesKey && message.text.startsWith('{')) {
                try {
                    const encryptedData = JSON.parse(message.text);
                    const decrypted = await crypto.decrypt(encryptedData, aesKey);
                    setDecryptedText(decrypted);
                } catch (e) {
                    console.log('Decryption failed, showing as plaintext:', e);
                    setDecryptedText(message.text);
                }
            } else {
                // Сообщение не зашифровано (от старой версии)
                setDecryptedText(message.text);
            }
            
            setIsDecrypting(false);
        }
        
        decryptMessage();
    }, [message.text, index]);

    useEffect(() => {
        if (index !== 0) return
        if (messagesTyping === null) {
            setShowTyping(false)
            return
        }
        setShowTyping(true)
        const check = setInterval(() => {
            const now = new Date()
            const ms = now - messagesTyping
            if (ms > 10000) {
                setShowTyping(false)
            }
        }, 1000)
        return () => clearInterval(check)
    }, [messagesTyping])

    if (index === 0) {
        if (showTyping){
            return <MessageBubbleFriend friend={friend} typing={true} refreshKey={refreshKey} />
        }
        return null
    }

    return message.is_me ? (
        <MessageBubbleMe text = {decryptedText || message.text} />
    ) : (
        <MessageBubbleFriend text = {decryptedText || message.text} friend={friend} refreshKey={refreshKey} />
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
    const [, setTick] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)

    const messagesList = useGlobal(state => state.messagesList)
    const thumbnailTimestamps = useGlobal(state => state.thumbnailTimestamps)

    const messageSend = useGlobal(state => state.messageSend)
    const messageList = useGlobal(state => state.messageList)
    const messageType = useGlobal(state => state.messageType)
    const getFriendPublicKey = useGlobal(state => state.getFriendPublicKey)

    const connectionID = route.params.id
    const friend = route.params.friend

    useEffect(() => {
        if (thumbnailTimestamps && Object.keys(thumbnailTimestamps).length > 0) {
            setRefreshKey(k => k + 1)
        }
    }, [thumbnailTimestamps])

    // Update the header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <MessageHeader friend={friend} refreshKey={refreshKey} />
            )
        })
    }, [refreshKey])

    useEffect(() => {
        messageList(connectionID)
        // Запросить ключ собеседника
        const exchangeDhKeys = useGlobal(state => state.exchangeDhKeys);
        const requestChatKey = useGlobal(state => state.requestChatKey);
        
        // Попробовать загрузить существующий ключ
        requestChatKey(connectionID);
        
        // Обменяться ключами с собеседником
        exchangeDhKeys(connectionID, friend.username);
    }, [])

    useEffect(() => {
        const hide = Keyboard.addListener('keyboardDidHide', () => {
            setTick(t => t + 1)
        })
        return () => hide.remove()
    }, [])

    function onSend() {
        const cleaned = message.replace(/\s+/g, ' ').trim()
        if (cleaned.length === 0) return
        messageSend(connectionID, cleaned)
        setMessage('')
    }

    function onType(value) {
        setMessage(value)
        messageType(friend.username)
    }

    return (
        <KeyboardAvoidingView behavior = {Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={80} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style = {{ 
                    flex: 1,
                    marginBottom: Platform.OS === 'ios' ? 60 : 0
                }}>
                    <FlatList
                        contentContainerStyle = {{
                            paddingTop: 30
                        }}
                        data={[{id: -1}, ...messagesList]}
                        inverted={true}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => (
                            <MessageBubble
                                index={index}
                                message={item}
                                friend={friend}
                                refreshKey={refreshKey}
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
                            setMessage = {onType}
                            onSend = {onSend}
                        />
                    </InputAccessoryView>
                ) : (
                    <MessageInput 
                        message = {message}
                        setMessage = {onType}
                        onSend = {onSend}
                    />
                )
            }
        </KeyboardAvoidingView>
    )
}

export default MessagesScreen
