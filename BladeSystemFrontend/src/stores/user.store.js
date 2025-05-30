import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { setLocalStageData, getLocalStageData, removeLocalStageData } from '../utils'
import { ElNotification } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const userAccount = ref(getLocalStageData('account'))
  const userEmail = ref(getLocalStageData('email'))
  const isGoogleUser = ref(false)

  const setUser = (payload) => {
    if (payload.account) {
      userAccount.value = payload.account
      setLocalStageData('account', userAccount.value)
    }
    if (payload.email) {
      userEmail.value = payload.email
      setLocalStageData('email', userEmail.value)
    }
    if (payload.isGoogleUser !== undefined) {
      isGoogleUser.value = payload.isGoogleUser
      setLocalStageData('isGoogleUser', isGoogleUser.value)
    }
  }

  const loginWithGoogle = async () => {
    try {
      const googleUser = await window.gapi.auth2.getAuthInstance().signIn()
      const googleUserProfile = googleUser.getBasicProfile()
      const googleIdToken = googleUser.getAuthResponse().id_token

      const response = await axios.post(`${import.meta.env.VITE_SERVER}/auth/google`, {
        token: googleIdToken
      })

      if (response.status === 201 || response.status === 200) {
        const data = response.data.data
        setLocalStageData('token', data.token)
        setUser({
          account: googleUserProfile.getName(),
          email: googleUserProfile.getEmail(),
          isGoogleUser: true
        })
        return true
      }
    } catch (error) {
      console.error('Google login error:', error)
      ElNotification({
        title: '登入失敗',
        message: '使用 Google 登入時發生錯誤',
        type: 'error'
      })
      return false
    }
  }

  const login = async (account, password) => {
    const payload = {
      account: account,
      password: password
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER}/sign-in`, payload)
      if (response.status === 201) {
        const data = response.data.data
        setLocalStageData('token', data.token)
        setUser({ 
          account: payload.account,
          isGoogleUser: false
        })
        return true
      }
    } catch (error) {
      if (error.response) {
        const msg = error.response.data.message
        if (msg === 'User not found') {
          ElNotification({
            title: '登入失敗',
            message: '帳號錯誤，請重新輸入',
            type: 'error'
          })
        } else if (msg === 'Wrong Password') {
          ElNotification({
            title: '登入失敗',
            message: '密碼錯誤，請重新輸入',
            type: 'error'
          })
        }
      }
      return false
    }
  }

  const logout = () => {
    if (isGoogleUser.value) {
      const auth2 = window.gapi.auth2.getAuthInstance()
      if (auth2) {
        auth2.signOut()
      }
    }
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key) {
        removeLocalStageData(key)
      }
    }
  }

  const changePassword = (oldPassword, newPassword) => {
    if (isGoogleUser.value) {
      ElNotification({
        title: '無法修改密碼',
        message: 'Google 登入用戶無法修改密碼',
        type: 'error'
      })
      return Promise.resolve(false)
    }

    const payload = {
      old_password: oldPassword,
      new_password: newPassword
    }
    const token = getLocalStageData('token')

    const headers = {
      Authorization: `Bearer ${token}`
    }
    return axios
      .post(`${import.meta.env.VITE_SERVER}/user/password`, payload, { headers: headers })
      .then((response) => {
        if (response.status === 200) {
          return true
        }
      })
      .catch((error) => {
        if (error.response) {
          const msg = error.response.data.message
          if (msg === 'The new password cannot be the same as the old one.') {
            ElNotification({
              title: '修改密碼失敗',
              message: '舊密碼不可與新密碼相同，請重新輸入',
              type: 'error'
            })
          } else if (msg === 'The old password was entered incorrectly.') {
            ElNotification({
              title: '修改密碼失敗',
              message: '舊密碼輸入錯誤，請重新輸入',
              type: 'error'
            })
          }
        }
        return false
      })
  }

  return {
    userAccount,
    userEmail,
    isGoogleUser,
    setUser,
    login,
    loginWithGoogle,
    logout,
    changePassword
  }
})
