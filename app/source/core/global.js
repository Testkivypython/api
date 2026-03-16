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

                secure.set('tokens', token)

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

    login: (credentials, user, tokens) => {
        secure.set('credentials', credentials)
        secure.set('tokens', tokens)
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

    socketConnect: async () => {
        const tokens = await secure.get('tokens')

        const url = `ws://${ADDRESS}/chat/?token=${tokens.access}`

        const socket = new WebSocket(url)
        console.log('socket.url: ', socket.url)
        socket.onopen = () => {
            utils.log('Socket connected')
            socket.send(JSON.stringify({ source: 'request.list' }))
            socket.send(JSON.stringify({ source: 'friend.list' }))
        }
        socket.onclose = () => {
            utils.log('Socket closed')
        }
        socket.onerror = (error) => {
            utils.log('Socket error: ', error)
        }
        socket.onmessage = (event) => {
            // Convert data to javascript object
            const parsed = JSON.parse(event.data)

            // Debug log formatted data
            utils.log('Socket message: ', parsed)

            const responses = {
                'friend.list': responseFriendList,
                'request.accept': responseRequestAccept,
                'request.list': responseRequestList,
                'request.connect': responseRequestConnect,
                'search': responseSearch,
                'thumbnail': responseThumbnail
            }
            const resp = responses[parsed.source]
            if (!resp) {
                utils.log('parsed.source "' + parsed.source + '" not found')
                return
            }
            // Call response function
            resp(set, get, parsed.data)
        }
        set((state) => ({
            socket: socket
        }))

        utils.log('TOKENS: ', tokens)
    },

    socketClose: () => {
        const socket = get().socket
        if (socket) {
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

}));

export default useGlobal
