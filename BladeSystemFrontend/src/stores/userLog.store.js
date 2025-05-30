import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { getLocalStageData } from '../utils'

export const useUserLogStore = defineStore('user-log', () => {
  const limit = ref(20)
  const logList = ref([])
  const meta = ref({
    current_page: 0,
    total_page: 0
  })
  const filterAccountOptions = ref([])
  const filterActionOptions = ref([])

  const getLogList = (page, limit, account = '', action = '') => {
    const query = {
      page: page,
      limit: limit,
      account: account,
      action: action
    }

    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }
    axios
      .get(`${import.meta.env.VITE_SERVER}/user/logs`, { params: query, headers: headers })
      .then((response) => {
        if (response.status === 200) {
          return response.data.data
        }
      })
      .then((data) => {
        logList.value = data.logList
        meta.value = data.meta

        return true
      })
      .catch((error) => {
        console.error(error)
        return false
      })
  }

  const getFilterOptions = () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }
    axios
      .get(`${import.meta.env.VITE_SERVER}/log/option-list`, { headers: headers })
      .then((response) => {
        if (response.status === 200) {
          return response.data.data
        }
      })
      .then((data) => {
        filterAccountOptions.value = ['全部', ...data.userList]
        filterActionOptions.value = ['全部', ...data.actionList]

        return true
      })
      .catch((error) => {
        console.error(error)
        return false
      })
  }

  return {
    getLogList,
    getFilterOptions,
    logList,
    meta,
    limit,
    filterAccountOptions,
    filterActionOptions
  }
})
