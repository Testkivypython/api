import { Text, TouchableOpacity, View, Image } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import RequestsScreen from './Requests'
import FriendsScreen from './Friends'
import ProfileScreen from './Profile'
import { useLayoutEffect, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import useGlobal from '../core/global'
import Thumbnail from '../common/Thumbnail'

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'

const Tab = createBottomTabNavigator()

function HomeScreen({ navigation }) {
    const socketConnect = useGlobal(state => state.socketConnect)
    const socketClose = useGlobal(state => state.socketClose)
    const user = useGlobal(state => state.user)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [])

    useEffect(() => {
        socketConnect()
        return () => {
            socketClose()
        }
    }, [])

    function onSearch(){
        navigation.navigate('Search')
    }

    return (
        <Tab.Navigator screenOptions={({ route, navigation }) => ({
            headerLeft: () => (
                <View style={{ marginLeft: 15 }}>
                    <Thumbnail url={user.thumbnail} size= {28} />
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity onPress = {onSearch}>
                <FontAwesomeIcon icon='magnifying-glass' style = {{ marginRight: 15 }} color="#404040" size={22} />
                </TouchableOpacity>
            ),
            tabBarIcon: ({ focused, color, size }) => {
                const icons = {
                    Requests: 'bell',
                    Friends: 'users',
                    Profile: 'user',
                }
                const icon = icons[route.name]
                return (
                    <FontAwesomeIcon icon={icon} color={color} size={28} />
                )
            },
            tabBarActiveTintColor: '#202020',
            tabBarShowLabel: false
        })}>
            <Tab.Screen name="Requests" component={RequestsScreen} />
            <Tab.Screen name="Friends" component={FriendsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    )
}

export default HomeScreen
