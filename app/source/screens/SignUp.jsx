import { Text, View, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, ActivityIndicator } from 'react-native'
import { useLayoutEffect, useState } from 'react'
import Input from '../common/input'
import Button from '../common/button'
import { SafeAreaView } from 'react-native-safe-area-context'

import API from '../core/api'
import utils from '../core/utils'
import useGlobal from '../core/global'

function SignUpScreen({ navigation }) {
    const [step, setStep] = useState(1)
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')

    const [emailError, setEmailError] = useState('')
    const [codeError, setCodeError] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [firstNameError, setFirstNameError] = useState('')
    const [lastNameError, setLastNameError] = useState('')
    const [password1Error, setPassword1Error] = useState('')
    const [password2Error, setPassword2Error] = useState('')

    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const login = useGlobal((state) => state.login)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [])

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
    }

    function onRequestCode() {
        const failEmail = !email || !validateEmail(email)
        if (failEmail) {
            setEmailError('Please enter a valid email')
            return
        }

        setLoading(true)
        API({
            method: 'POST',
            url: '/chat/request-verification/',
            data: { email }
        }).then(response => {
            setLoading(false)
            setEmailSent(true)
            setStep(2)
        }).catch(error => {
            setLoading(false)
            const msg = error.response?.data?.error || 'Failed to send code'
            setEmailError(msg)
        })
    }

    function onSignUp() {
        const failCode = !code || code.length !== 6
        if (failCode) {
            setCodeError('Code must be 6 digits')
        }

        const failUsername = !username || username.length < 5
        if (failUsername) {
            setUsernameError('Username must be at least 5 characters')
        }

        const failFirstName = !firstName
        if (failFirstName) {
            setFirstNameError('First Name was not provided')
        }

        const failPassword1 = !password1 || password1.length < 8
        if (failPassword1) {
            setPassword1Error('Password must be at least 8 characters')
        }

        const failPassword2 = password1 !== password2
        if (failPassword2) {
            setPassword2Error('Passwords don\'t match')
        }

        if (failCode || failUsername || failFirstName || failPassword1 || failPassword2) {
            return
        }

        setLoading(true)
        API({
            method: 'POST',
            url: '/chat/signup/',
            data: {
                email: email,
                code: code,
                username: username,
                first_name: firstName,
                last_name: lastName,
                password: password1
            }
        }).then(response => {
            setLoading(false)
            utils.log('Sign Up Response:', response.data)
            const credentials = {
                username: username,
                password: password1
            } 
            
            login(credentials, response.data.user, response.data.tokens)
        }).catch(error => {
            setLoading(false)
            if (error.response) {
                const data = error.response.data
                if (data.code) {
                    setCodeError(data.code[0])
                } else if (data.email) {
                    setEmailError(data.email[0])
                } else {
                    console.log(data)
                }
            }
            else if (error.request) {
                console.log(error.request)
            }
            else {
                console.log('Error', error.message)
            }
        })
    }

    return (
        <SafeAreaView style = {{flex: 1}}>
            <KeyboardAvoidingView behavior = "height" style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
                    <View style = {{flex: 1, justifyContent: 'center', paddingHorizontal: 16}}>
                        <Text style = {{ textAlign: 'center', fontSize: 36, fontWeight: 'bold', marginVertical: 30 }}>
                            {step === 1 ? 'Enter Email' : 'Verify & Sign Up'}
                        </Text>

                        {step === 1 ? (
                            <>
                                <Input 
                                    title='Email'
                                    value={email}
                                    error={emailError}
                                    setValue={setEmail}
                                    setError={setEmailError}
                                    autoCapitalize='none'
                                    keyboardType='email-address'
                                />
                                <Button 
                                    title={loading ? 'Sending...' : 'Send Code'} 
                                    onPress={onRequestCode}
                                    disabled={loading}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                                    Code sent to {email}
                                </Text>
                                <Input 
                                    title='Verification Code'
                                    value={code}
                                    error={codeError}
                                    setValue={setCode}
                                    setError={setCodeError}
                                    keyboardType='numeric'
                                    maxLength={6}
                                />
                                <Input 
                                    title='Username'
                                    value={username}
                                    error={usernameError}
                                    setValue={setUsername}
                                    setError={setUsernameError}
                                    autoCapitalize='none'
                                />
                                <Input 
                                    title='First Name'
                                    value={firstName}
                                    error={firstNameError}
                                    setValue={setFirstName}
                                    setError={setFirstNameError}
                                />
                                <Input 
                                    title='Last Name (optional)'
                                    value={lastName}
                                    error={lastNameError}
                                    setValue={setLastName}
                                    setError={setLastNameError}
                                />
                                <Input 
                                    title='Password' 
                                    value={password1}
                                    error={password1Error}
                                    setValue={setPassword1}
                                    setError={setPassword1Error}
                                    secureTextEntry={true}
                                />
                                <Input
                                    title='Retype Password' 
                                    value={password2}
                                    error={password2Error}
                                    setValue={setPassword2}
                                    setError={setPassword2Error}
                                    secureTextEntry={true}
                                />

                                <Button 
                                    title={loading ? 'Signing Up...' : 'Sign Up'} 
                                    onPress={onSignUp}
                                    disabled={loading}
                                />
                                
                                <Text 
                                    style={{ textAlign: 'center', marginTop: 15, color: 'blue' }}
                                    onPress={() => { setStep(1); setEmailSent(false); }}
                                >
                                    Change email
                                </Text>
                            </>
                        )}

                        <Text style = {{ textAlign: 'center', marginVertical: 30 }}>
                            Already have an account? <Text style = {{ color: 'blue'}} onPress={() => navigation.goBack()}>Sign In</Text>
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default SignUpScreen
