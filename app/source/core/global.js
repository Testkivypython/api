import { create } from 'zustand';
import secure from './secure'
import API from './api'
import { ADDRESS } from './api'
import utils from './utils'

// -----------------------------------------------
//         Socket receive message handlers
// -----------------------------------------------

function responseFriendList(set, get, friendList) {
    set((state) => ({ friendList: friendList }));
}

function responseFriendNew(set, get, friend) {
    const friendList = [friend, ...get().friendList]
    set((state) => ({ friendList: friendList }));
}

function responseMessageList(set, get, data) {
    set((state) => ({
        messagesList: [...get().messagesList, ...data.messages],
        messagesUsername: data.friend.username
    }));
}

function responseMessageSend(set, get, data) {
    const username = data.friend.username
    // Move friendList item for this friend to the start of the list, update the prewiew text and update the time stamp
    const friendList = [...get().friendList]
    const friendIndex = friendList.findIndex(item => item.friend.username === username)
    if (friendIndex >= 0) {
        const item = friendList[friendIndex]
        item.preview = data.message.text
        item.updated = data.message.created
        friendList.splice(friendIndex, 1)
        friendList.unshift(item)
        set((state) => ({ friendList: friendList }))
    }
    // If the message data does not belong to this friend then don't update the message list, 
    // as a fresh messageList will be loaded when the user opens the correct chat window
    if (username !== get().messagesUsername) {
        return
    }

    const messagesList = [data.message, ...get().messagesList]
    set((state) => ({ messagesList:  messagesList, messagesTyping: null }));
}

function responseMessageType(set, get, data) {
    if (data.username !== get().messagesUsername) {
        return
    }
    set((state) => ({ messagesTyping: new Date() }))
}

function responseRequestConnect(set, get, connection) {
    const user = get().user
    // if i was the sender, update search list row
    if (user.username === connection.sender.username) {
        const searchList = [...get().searchList]
        const searchIndex = searchList.findIndex(item => item.username === connection.receiver.username)

        if (searchIndex >= 0) {
            searchList[searchIndex].status = 'pending-them'
            set((state) => ({ searchList: searchList }))
        }
    }
    // if i was the receiver, update request list
    else {
        const requestList = [...get().requestList]
        const requestIndex = requestList.findIndex(item => item.sender.username === connection.sender.username)

        if (requestIndex === -1) {
            requestList.unshift(connection)
            set((state) => ({ requestList: requestList }))
        }
    }
}

function responseRequestAccept(set, get, connection) {
    const user = get().user
    // if i was one who accepted the connection, update request list
    if (user.username === connection.receiver.username) {
        const requestList = [...get().requestList]
        const requestIndex = requestList.findIndex(item => item.id === connection.id)
        if (requestIndex >= 0) {
            requestList.splice(requestIndex, 1)
            set((state) => ({ requestList: requestList }))
        }
    }
    // If the sender is contained within searchList, update it
    const sl = get().searchList
    if (sl === null) {
        return
    }
    const searchList = [...sl]

    let searchIndex = -1
    // if this user accepted the connection
    if (user.username === connection.receiver.username) {
        searchIndex = searchList.findIndex(item => item.username === connection.sender.username)
    } // If the other user accepted the connection
    else {
        searchIndex = searchList.findIndex(item => item.username === connection.receiver.username)
    }
    if (searchIndex >= 0) {
        searchList[searchIndex].status = 'connected'
        set((state) => ({ searchList: searchList }))
    }
}


function responseRequestList(set, get, requestList) {
    set((state) => ({ requestList: requestList }));
}

function responseSearch(set, get, data) {
    set((state) => ({ searchList: data }));
}

function responseThumbnail(set, get, data) {
    set((state) => ({ user: data }));
    const thumbnailTimestamps = { ...get().thumbnailTimestamps }
    thumbnailTimestamps[data.username] = Date.now()
    set((state) => ({ thumbnailTimestamps }))
}

function responseFriendThumbnail(set, get, userData) {
    const timestamp = Date.now()
    
    set((state) => {
        const currentList = state.friendList
        let updatedList = currentList
        
        if (currentList) {
            updatedList = currentList.map(item => {
                if (item.friend.username === userData.username) {
                    return {
                        ...item,
                        friend: userData,
                        _thumbnailTimestamp: timestamp
                    }
                }
                return item
            })
        }
        
        const thumbnailTimestamps = { ...state.thumbnailTimestamps }
        thumbnailTimestamps[userData.username] = timestamp
        
        return {
            friendList: updatedList,
            thumbnailTimestamps
        }
    })
}

function responseDhPublicKey(set, get, data) {
    const { username, public_key } = data;
    
    // Найти connection ID для этого пользователя
    const connection = get().friendList?.find(f => f.friend.username === username);
    if (!connection) {
        console.log('Connection not found for:', username);
        return;
    }
    
    // Вычислить общий ключ
    crypto.deriveSharedSecret(crypto.getPrivateKey(), public_key)
        .then(sharedSecret => crypto.deriveChatKey(sharedSecret, connection.id))
        .then(aesKey => {
            // Сохранить в secure store
            crypto.saveChatKey(connection.id, aesKey);
            
            // Сохранить в состояние
            const chatKeys = { ...get().chatKeys };
            chatKeys[connection.id] = aesKey;
            set({ chatKeys });
            
            console.log('DH key exchange completed for chat:', connection.id);
        })
        .catch(error => {
            console.log('DH key exchange failed:', error);
        });
}

const useGlobal = create((set, get) => ({
    // ------------------------------
    //         Initialization
    // ------------------------------

    initialized: false,

    init: async () => {
        const credentials = await secure.get('credentials')
        if (credentials) {
            
            try {
                const response = await API({
                    method: 'POST',
                    url: '/chat/signin/',
                    data: {
                        username: credentials.username,
                        password: credentials.password
                    }
                })

                if (response.status !== 200) {
                    throw 'Authentication error'
                }
                const user = response.data.user
                const token = response.data.tokens

                await secure.set('tokens', token)

                const hasKeys = await crypto.hasKeys()
                console.log('Server has public key, local keys:', hasKeys)
                
                if (!hasKeys) {
                    await crypto.generateECDHKeyPair();
                }

                set((state) => ({
                    initialized: true,
                    authenticated: true,
                    user: user
                }))
                return
            } catch (error) {
                console.log('useGlobal.init: ' + error)
            }    
        }
        set((state) => ({
            initialized: true,
        }))
    },

    // ------------------------------
    //         Authentication
    // ------------------------------
    
    authenticated: false,
    user: {},

    login: async (credentials, user, tokens) => {
        await secure.set('credentials', credentials)
        await secure.set('tokens', tokens)

        const hasKeys = await crypto.hasKeys();
        if (!hasKeys) {
            await crypto.generateECDHKeyPair();
        }
        
        set((state) => ({
            authenticated: true,
            user: user
        }));
    },

    logout: () => {
        secure.wipe()
        set((state) => ({
            authenticated: false,
            user: {}
        }));
    },

    // ------------------------------
    //           WebSocket
    // ------------------------------
    
    socket: null,
    socketId: 0,

    socketConnect: async () => {
        console.log('socketConnect CALLED')
        const currentSocket = get().socket
        console.log('socketConnect: current state:', currentSocket?.readyState)
        
        if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
            console.log('socketConnect: Already connected or connecting, returning')
            return
        }
        
        // Clear stale socket reference if exists
        if (currentSocket && (currentSocket.readyState === WebSocket.CLOSED || currentSocket.readyState === WebSocket.CLOSING)) {
            set((state) => ({ socket: null }))
        }
        
        const tokens = await secure.get('tokens')
        
        if (!tokens?.access) {
            console.log('socketConnect: No access token')
            return
        }

        const url = `wss://${ADDRESS}/chat/?token=${tokens.access}`
        const currentSocketId = get().socketId + 1
        set((state) => ({ socketId: currentSocketId }))

        const socket = new WebSocket(url)
        console.log('socket created, id:', currentSocketId, 'url:', socket.url)
        socket.onopen = () => {
            console.log('Socket connected, id:', currentSocketId)
            set((state) => ({ socketReconnecting: false, socketReconnectAttempts: 0 }))
            socket.send(JSON.stringify({ source: 'request.list' }))
            socket.send(JSON.stringify({ source: 'friend.list' }))
        }
        socket.onclose = (event) => {
            console.log('Socket closed, code:', event.code, 'id:', currentSocketId, 'reason:', event.reason)
            // Clear socket from state
            set((state) => ({ socket: null }))

        }
        socket.onerror = (error) => {
            console.log('Socket error:', error)
        }
        socket.onmessage = (event) => {
            // Convert data to javascript object
            const parsed = JSON.parse(event.data)

            // Debug log formatted data
            utils.log('Socket message: ', parsed)

            const responses = {
                'friend.list': responseFriendList,
                'friend.new': responseFriendNew,
                'message.list': responseMessageList,
                'message.send': responseMessageSend,
                'message.type': responseMessageType,
                'request.accept': responseRequestAccept,
                'request.list': responseRequestList,
                'request.connect': responseRequestConnect,
                'search': responseSearch,
                'thumbnail': responseThumbnail,
                'friend.thumbnail': responseFriendThumbnail,
                'dh_public_key': responseDhPublicKey
            }
            const resp = responses[parsed.source]
            if (!resp) {
                utils.log('parsed.source "' + parsed.source + '" not found')
                return
            }
            
            resp(set, get, parsed.data)
        }
        set((state) => ({
            socket: socket
        }))

        utils.log('TOKENS: ', tokens)
    },

    socketClose: () => {
        console.log('socketClose called')
        const socket = get().socket
        if (socket) {
            console.log('Closing socket')
            socket.close()
        }
        set((state) => ({
            socket: null
        }))
    },

    // ------------------------------
    //            Search
    // ------------------------------

    searchList: null,

    searchUsers: (query) => {
        if (query) {
            const socket = get().socket
            socket.send(JSON.stringify({
                source: 'search',
                query: query
            }))
        } else {
            set((state) => ({
                searchList: null
            }))
        }
    },

    // ------------------------------
    //            Requests
    // ------------------------------

    requestList: null,

    requestAccept: (username) => {
        const socket = get().socket
        socket.send(JSON.stringify({
            source: 'request.accept',
            username: username
        }))
    },

    requestConnect: (username) => {
        const socket = get().socket
        socket.send(JSON.stringify({
            source: 'request.connect',
            username: username
        }))
    },


    // ------------------------------
    //           Thumbnail
    // ------------------------------

    uploadThumbnail: (file) => {
        const socket = get().socket
        socket.send(JSON.stringify({
            source: 'thumbnail',
            base64: file.base64,
            filename: file.fileName
        }))
    },

    // ------------------------------
    //            Friends
    // ------------------------------

    friendList: null,
    thumbnailTimestamps: {},

    // ------------------------------
    //            Messages
    // ------------------------------
    messagesList: [],
    messagesUsername: null,
    messagesTyping: null,

    // ------------------------------
    //            Encryption
    // ------------------------------
    chatKeys: {}, 

    exchangeDhKeys: async (connectionId, friendUsername) => {
        const socket = get().socket;
        const myPublicKey = await crypto.getPublicKey();
        
        socket.send(JSON.stringify({
            source: 'dh_public_key',
            username: friendUsername,
            public_key: myPublicKey
        }));
    },
    requestChatKey: (connectionId) => {
        // Загрузить ключ из secure store если есть
        crypto.getChatKey(connectionId).then(key => {
            if (key) {
                const chatKeys = { ...get().chatKeys };
                chatKeys[connectionId] = key;
                set({ chatKeys });
            }
        });
    },

    messageList: (connectionID, page = 0) => {
        if (page === 0) {
            set((state) => ({
                messagesList: [],
                messagesUsername: null,
                messagesTyping: null
            }))
        }
        const socket = get().socket
        socket.send(JSON.stringify({
            source: 'message.list',
            connectionID: connectionID,
            page: page
        }))
    },

    messageSend: async (connectionID, message) => {
        const socket = get().socket;
        const aesKey = get().chatKeys[connectionID];
        
        let messageData = message;
        
        if (aesKey) {
            // Шифровать сообщение
            try {
                const encrypted = await crypto.encrypt(message, aesKey);
                messageData = JSON.stringify(encrypted);
            } catch (e) {
                console.log('Encryption failed:', e);
                // Блокируем отправку если шифрование не удалось
                console.warn('Message blocked: encryption failed');
                return;
            }
        } else {
            // Ключ недоступен - блокировать отправку
            console.warn('Message blocked: no chat key for connection', connectionID);
            return;
        }
        
        socket.send(JSON.stringify({
            source: 'message.send',
            connectionID: connectionID,
            message: messageData
        }));
    },

    messageType: (username) => {
        const socket = get().socket
        socket.send(JSON.stringify({
            source: 'message.type',
            username: username
        }))
    }
}));

export default useGlobal
