<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton title="匯入刀片加工履歷" main>
        <!-- 用來隱藏預設 icon 的 -->
        <div></div
      ></SectionTitleLineWithButton>

      <div class="flex flex-col gap-10">
        <DropFileZone
          ref="dropFileZone"
          :msg="dropZoneMsg"
          :can-upload="canUpload"
          @update:msg="updateMessage"
          @update:can-upload="updateUpload"
          @update:can-predict="updatePredict"
        />

        <div
          v-if="
            (predictionStore.step === 'check' && predictionStore.status === 'success') ||
            predictionStore.step === 'predict'
          "
          class="flex flex-row items-center gap-5 p-4"
        >
          <BaseIcon :path="mdiFileOutline" size="40" w="w-7" />

          <span class="flex flex-col gap-1">
            <p>{{ predictionStore.filename }}</p>
            <p>匯入時間：{{ predictionStore.uploadFileDate }}</p>
          </span>

          <div class="ml-auto flex flex-row items-center gap-6">
            <BaseButton
              color="success"
              label="開始預測"
              :icon="mdiPlay"
              :disabled="!canPredict"
              @click="handlePrediction"
            />
          </div>
        </div>

        <!-- status === failed -->
        <div
          v-if="predictionStore.status === 'failed'"
          class="flex flex-col gap-5 font-extrabold text-base text-red-500"
        >
          <div v-if="predictionStore.step === 'check'" class="flex flex-row gap-2 pl-3">
            <BaseIcon :path="mdiCloseCircle" size="60" w="w-8" />
            <p>資料格式錯誤，請修正資料並重新匯入檔案</p>
          </div>

          <p v-else>資料串聯錯誤，請修正資料並重新匯入檔案</p>

          <div class="flex flex-col pl-5">
            <div
              v-for="msg in predictionStore.messages"
              :key="msg.type"
              class="flex flex-col items-start"
            >
              <div class="flex flex-row">
                <BaseIcon :path="mdiClose" size="60" />
                <p class="whitespace-nowrap">{{ msg.title }}</p>
              </div>
              <p class="pl-6">{{ msg.message }}</p>
            </div>
          </div>
        </div>

        <!-- status === success -->
        <div
          v-if="
            predictionStore.status === 'success' && predictionStore.step === 'check' && canPredict
          "
          class="flex flex-col gap-5 font-extrabold text-base"
          style="color: rgb(5 150 105)"
        >
          <div
            v-if="predictionStore.step === 'check' && canPredict"
            class="flex flex-row gap-2 pl-3"
          >
            <BaseIcon :path="mdiCheckCircle" size="60" w="w-8" />
            <p>資料匯入成功</p>
          </div>
        </div>

        <!-- 只在完成預測時顯示 -->
        <hr v-if="predictionStore.step === 'predict' && predictionStore.status === 'success'" />
        <div
          v-if="predictionStore.step === 'predict' || (!canPredict && !canUpload)"
          class="flex flex-col items-center justify-center gap-5"
        >
          <div
            v-if="predictionStore.status === 'processing' || (!canPredict && !canUpload)"
            class="flex flex-col items-center font-bold text-2xl"
          >
            <Loader></Loader>
            <p>資料處理中，請稍等</p>
          </div>
          <div
            v-else-if="predictionStore.status === 'success'"
            class="flex flex-col justify-center gap-2"
          >
            <p class="text-center font-bold text-2xl">預測成功！</p>
            <p class="text-base font-normal">
              完成預測時間: {{ predictionStore.predictFinishTime }}
            </p>
          </div>
          <BaseButton
            v-if="predictionStore.step === 'predict' && predictionStore.status === 'success'"
            color="info"
            :outline="true"
            label="查看刀片預測結果"
            to="/blade-prediction-result"
          />
        </div>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePredictionStore } from '@/stores/prediction'

import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import DropFileZone from '@/components/DropFileZone.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import Loader from '@/components/Loader.vue'

import { mdiPlay, mdiClose, mdiFileOutline, mdiCloseCircle, mdiCheckCircle } from '@mdi/js'
import { ElNotification } from 'element-plus'

const dropFileZone = ref(null)
const timeoutID = ref('')

const dropZoneMsg = ref('選擇檔案或將檔案拖移至此')
const canUpload = ref(true)
const canPredict = ref(true)
const predictionStore = usePredictionStore()

const handlePrediction = async () => {
  updateUpload(false)
  updatePredict(false)
  const r = await predictionStore.predict()

  if (r !== '') {
    ElNotification({
      title: '預測失敗',
      message: `錯誤訊息：${r}`,
      type: 'error'
    })
    updateUpload(true)
    updatePredict(true)
  }
}

const updateMessage = (newMsg) => {
  dropZoneMsg.value = newMsg
}

const updateUpload = (v) => {
  canUpload.value = v
}

const updatePredict = (v) => {
  canPredict.value = v
}

const checkStatusProcess = () => {
  predictionStore.getStatus().then(() => {
    console.log(predictionStore.step, predictionStore.status)
    if (predictionStore.step === 'check' && predictionStore.status === 'processing') {
      updateMessage('檢查檔案資料中，請等待...')
      updateUpload(false)
    } else if (predictionStore.step === 'check' && predictionStore.status === 'success') {
      updateUpload(true)
      updatePredict(true)
      updateMessage('選擇檔案或將檔案拖移至此')
    } else if (predictionStore.step === 'predict' && predictionStore.status === 'processing') {
      updateUpload(false)
      updatePredict(false)
    } else if (predictionStore.step === 'predict' && predictionStore.status === 'failed') {
      updateUpload(true)
      updatePredict(false)
    } else if (predictionStore.step === 'predict' && predictionStore.status === 'success') {
      updatePredict(false)
      updateUpload(true)
    } else {
      updateMessage('選擇檔案或將檔案拖移至此')
      updateUpload(true)
    }
  })

  timeoutID.value = setTimeout(() => {
    checkStatusProcess()
  }, 10 * 1000)
}

/**
 * 為了避免下一次在畫面中顯示完成時間
 * 離開頁面時呼叫 API 更新狀態
 */
const resetPredictStatus = () => {
  if (predictionStore.status === 'success' && predictionStore.step === 'predict') {
    predictionStore.resetPredictStatus()
  }
}

onMounted(() => {
  checkStatusProcess()
})

onUnmounted(() => {
  clearTimeout(timeoutID.value)
  resetPredictStatus()
})
</script>
