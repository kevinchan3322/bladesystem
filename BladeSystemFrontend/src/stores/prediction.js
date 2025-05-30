import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { getLocalStageData } from '../utils'

export const usePredictionStore = defineStore('prediction', () => {
  const file = ref(null)
  const step = ref('idle')
  const status = ref('idle')
  const filename = ref('')
  const uploadFileDate = ref('')
  const predictFinishTime = ref('')
  const predictionResults = ref([])
  const messages = ref([])
  const cycleDate = ref('')

  const setFile = (f) => {
    file.value = f
  }

  const checkFileData = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    const formData = new FormData()

    formData.append('file', file.value)

    return axios
      .post(`${import.meta.env.VITE_SERVER}/prediction/upload-check`, formData, {
        headers: headers
      })
      .then(() => {
        return ''
      })
      .catch((error) => {
        // 處理錯誤
        console.error('Error uploading file', error)
        if (error.response) {
          return error.response.data.message
        }
        return error.message
      })
  }

  const getStatus = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    return axios
      .get(`${import.meta.env.VITE_SERVER}/prediction/status`, { headers: headers })
      .then((response) => {
        return response.data.data
      })
      .then((data) => {
        step.value = data.step
        status.value = data.status
        filename.value = data.filename
        messages.value = data.messages
        if (data.content) uploadFileDate.value = new Date(data.content).toLocaleString()

        if (status.value === 'success' && step.value === 'predict') {
          const utcDate = new Date(data.updatedAt)
          predictFinishTime.value = utcDate.toLocaleString()
        }
      })
      .catch((error) => {
        // 處理錯誤
        console.error('Error uploading file', error)
        return false
      })
  }

  const predict = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    return axios
      .post(`${import.meta.env.VITE_SERVER}/prediction/predict`, {}, { headers: headers })
      .then(() => {
        return ''
      })
      .catch((error) => {
        // 處理錯誤
        if (error.response) {
          return error.response.data.message
        }
        return error.message
      })
  }

  const resetStatus = () => {
    file.value = null
    status.value = 'idle'
    step.value = 'idle'
    filename.value = ''
    predictFinishTime.value = ''
    messages.value = []
  }

  const getPredictionResult = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    return axios
      .get(`${import.meta.env.VITE_SERVER}/prediction`, { headers: headers })
      .then((response) => {
        return response.data.data
      })
      .then((data) => {
        predictionResults.value = data
      })
      .catch((error) => {
        console.error(error)
        return false
      })
  }

  const updateFeedback = async (
    bladeSpecification,
    bladeHolderID,
    machineID,
    needChangeBlade,
    skipCycle,
    expireTime,
    tag
  ) => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }
    const payload = {
      刀片規格: bladeSpecification,
      刀柄編號: bladeHolderID,
      機台: machineID,
      statusFrom: needChangeBlade,
      statusTo: !needChangeBlade,
      skip_cycle: skipCycle,
      expireTime: expireTime,
      tag: tag
    }

    return axios
      .post(`${import.meta.env.VITE_SERVER}/prediction/feedback`, payload, { headers: headers })
      .then(() => {
        return 'success'
      })
      .catch((error) => {
        // 處理錯誤
        if (error.response) {
          return error.response.data.message
        }
        return error.message
      })
  }

  const getCurrentCycle = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    return axios
      .get(`${import.meta.env.VITE_SERVER}/prediction/cycle`, { headers: headers })
      .then((response) => {
        return response.data.data
      })
      .then((data) => {
        cycleDate.value = data.cycle_date
      })
      .catch((error) => {
        console.error(error)
        return false
      })
  }

  const downloadFile = async (name) => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    const params = {
      name: name
    }

    return axios
      .get(`${import.meta.env.VITE_SERVER}/prediction/data`, { params: params, headers: headers })
      .then((response) => {
        return response.data.data
      })
      .catch((error) => {
        // 處理錯誤
        if (error.response) {
          return error.response.data.message
        }
        return error.message
      })
  }

  const resetPredictStatus = async () => {
    const headers = {
      Authorization: `Bearer ${getLocalStageData('token')}`
    }

    return axios
      .post(`${import.meta.env.VITE_SERVER}/prediction/reset`, {}, { headers: headers })
      .then((response) => {
        return true
      })
      .catch((error) => {
        console.error(error)
        return false
      })
  }

  return {
    setFile,
    checkFileData,
    getStatus,
    resetStatus,
    predict,
    getPredictionResult,
    updateFeedback,
    getCurrentCycle,
    downloadFile,
    resetPredictStatus,
    file,
    status,
    messages,
    step,
    filename,
    uploadFileDate,
    predictFinishTime,
    predictionResults,
    cycleDate
  }
})
