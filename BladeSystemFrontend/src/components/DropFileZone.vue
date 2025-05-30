<template>
  <div
    class="flex items-center justify-center w-full"
    @dragleave.prevent="dragleave"
    @dragover.prevent="dragover"
    @drop.prevent="drop"
  >
    <label
      for="dropzone-file"
      class="flex flex-row items-center justify-start gap-10 w-full h-[80px] p-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
    >
      <div class="flex flex-row items-center justify-center pt-5 pb-6 gap-6">
        <BaseIcon :path="mdiCloudUploadOutline" size="40" w="w-10" />
      </div>

      <div class="flex flex-col gap-2">
        <p class="font-normal text-sm">{{ msg }}</p>
        <p class="font-normal text-sm text-gray-500">XLSX 檔案</p>
      </div>

      <div class="ml-auto flex flex-row items-center gap-6">
        <BaseButton
          color="info"
          :outline="true"
          label="匯入檔案"
          :disabled="!canUpload"
          @click="handleClickUploader"
        />
      </div>
      <input
        id="dropzone-file"
        ref="uploader"
        type="file"
        class="hidden"
        accept=".xlsx"
        :disabled="!canUpload"
        @change="handleUploadFile($event.target.files)"
        @click="$event.target.value = ''"
      />
    </label>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { usePredictionStore } from '@/stores/prediction'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'

import { mdiCloudUploadOutline } from '@mdi/js'
import { ElNotification } from 'element-plus'

const emit = defineEmits(['update:msg', 'update:can-upload', 'update:can-predict'])
const props = defineProps({
  msg: {
    type: String,
    default: null
  },
  canUpload: {
    type: Boolean,
    default: null
  }
})

const predictionStore = usePredictionStore()

const uploader = ref(null)

const handleClickUploader = () => {
  uploader.value.click()
}

const handleUploadFile = async (files) => {
  if (files.length === 0) return

  predictionStore.resetStatus()
  predictionStore.setFile(files[0])

  changeUpload(false)
  changePredict(false)
  changeMessage('檢查檔案資料中，請等待...')

  const r = await predictionStore.checkFileData()

  if (r !== '') {
    ElNotification({
      title: '檢查檔案資料錯誤',
      message: `錯誤訊息：${r}`,
      type: 'error'
    })
  }
}

const dragover = (e) => {
  e.preventDefault()
}

const dragleave = () => {}

const drop = (e) => {
  e.preventDefault()

  if (props.canUpload === false) {
    ElNotification({
      title: '檢查檔案資料中，請等待...',
      message: `請稍後再嘗試`,
      type: 'info'
    })
    return
  }

  const f = e.dataTransfer.files[0]
  const fileExtension = f.name.split('.').pop().toLowerCase()

  if (fileExtension !== 'xlsx') {
    ElNotification({
      title: '資料格式錯誤',
      message: `上傳檔案類型不為 xlsx，請確認後重新上傳'`,
      type: 'error'
    })
    return
  } else {
    handleUploadFile(e.dataTransfer.files)
  }
}

const changeMessage = (newMsg) => {
  emit('update:msg', newMsg)
}

const changeUpload = (v) => {
  emit('update:can-upload', v)
}
const changePredict = (v) => {
  emit('update:can-predict', v)
}
</script>
