<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton title="刀片預測" main>
        <NavBarItemPlain use-margin class="flex gap-5">
          <FormControl
            v-model="filerID"
            class="min-w-[150px]"
            :options="filerIDOptions"
            @change="handleChangeFilter"
          />
          <FormControl
            v-model="filterAction"
            class="min-w-[150px]"
            :options="filterActionOptions"
            @change="handleChangeFilter"
          />
        </NavBarItemPlain>
      </SectionTitleLineWithButton>

      <NavBarItemPlain use-margin class="flex gap-5 justify-end">
        <FormCheckRadioGroup
          v-model="isShowOnline"
          name="remember"
          :options="{ online: '上線' }"
          @change="handleChangeFilter"
        />
        
        <FormCheckRadioGroup
          v-model="isShowOffline"
          name="remember"
          :options="{ offline: '下線' }"
          @change="handleChangeFilter"
        />
        
      </NavBarItemPlain>

      <table>
        <thead>
          <tr>
            <th>機台編號</th>
            <th>刀柄編號</th>
            <th>刀片狀態</th>
            <th>刀片規格</th>
            <th>是否換刀</th>
            <th>當下示警週期</th>
            <th>操作</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in recordList"
            :key="`${item['機台']} + ${item['刀片編號']} + ${item['刀柄編號']}`"
            :class="getTrClass(item)"
          >
            <td data-label="機台編號">
              {{ item['機台'] }}
            </td>
            <td data-label="刀柄編號">
              {{ item['刀柄編號'] }}
            </td>
            <td data-label="刀片狀態">
              {{ item['刀片狀態'] }}
            </td>
            <td data-label="刀片規格">
              {{ item['刀片規格'] }}
            </td>

            <td v-if="item.feedback === undefined" data-label="是否換刀">
              {{ item.needChangeBlade ? '請換刀' : '不須換刀' }}
            </td>
            <td v-else data-label="是否換刀">
              <!-- 根據 feedback 要改成的狀態做顯示 -->
              {{ item.feedback.statusTo ? '請換刀' : '不須換刀' }}
            </td>

            <td data-label="當下示警週期">
              {{ item.alertCycle }}
            </td>

            <td data-label="操作">
              <BaseButton
                v-if="item['feedback'] === undefined"
                color="info"
                small
                label="修正回饋"
                @click="handleShowModal(item)"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex justify-center p-6 lg:px-6 border-t border-gray-100 dark:border-slate-800">
        <el-pagination
          v-model:current-page="currentPage"
          background
          layout="prev, pager, next"
          :page-count="totalPage"
          @current-change="handlePageChange"
        />
      </div>
    </SectionMain>
  </LayoutAuthenticated>

  <CardBoxModal
    v-if="isModalActive"
    v-model="isModalActive"
    class="text-black dark:text-white"
    :title="'機台 ' + modalItem['機台'] + ' 修正回饋'"
    button-label="確認"
    has-cancel
    @confirm="updateFeedback"
    @cancel="resetModal"
  >
    <div v-if="modalItem.needChangeBlade" class="flex flex-col gap-5">
      <span class="flex gap-1 font-semibold">
        請換刀 修正成
        <p class="text-red-600">不須換刀</p>
      </span>
      <div class="flex flex-col gap-2 min-h-[106px]">
        <p>略過週期(Cycle)數</p>
        <input
          v-model="modalAlertCycle"
          class="w-full"
          type="number"
          min="0"
          @change="
            () => {
              if (modalAlertCycle < 0) modalAlertCycle = 0
            }
          "
        />
        <span v-if="modalAlertCycle > 0 && modalAlertCycle !== ''" class="flex gap-1">
          此刀片在
          <p class="text-red-600">
            {{ calculateCycle(modalItem.alertCycle, modalAlertCycle) }}
          </p>
          前都修正成不須換刀
        </span>
      </div>
    </div>
    <div v-else>
      <span class="flex gap-1 font-semibold">
        不須換刀 修正成
        <p class="text-red-600">請換刀</p>
      </span>
    </div>
  </CardBoxModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePredictionStore } from '@/stores/prediction'
import { formatDateWithTimezone } from '@/utils.js'

import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import NavBarItemPlain from '@/components/NavBarItemPlain.vue'
import FormControl from '@/components/FormControl.vue'
import FormCheckRadioGroup from '@/components/FormCheckRadioGroup.vue'
import { ElNotification } from 'element-plus'

const predictionStore = usePredictionStore()
const modalAlertCycle = ref(0)

const isModalActive = ref(false)
const modalItem = ref(null)
const filerID = ref('全部')
const filterAction = ref('全部')
const filerIDOptions = ref([])
const filterActionOptions = ref(['全部', '請換刀', '不須換刀'])
const itemsPaginated = ref()
const isShowOnline = ref(true);
const isShowOffline = ref(false);
const currentPage = ref(1);
const totalPage = computed(() => {
  if (!itemsPaginated.value) return 0;

  return Math.ceil(itemsPaginated.value.length / perPage);
})
const perPage = 15;

const handleChangeFilter = () => {
  let actionV = false

  if (filterAction.value === '請換刀') actionV = true

  itemsPaginated.value = filterShowResults(predictionStore.predictionResults)
    .filter((e) => {
      if (filerID.value === '全部') return true

      return e['機台'] === filerID.value
    })
    .filter((e) => {
      if (filterAction.value === '全部') return true

      // 修正回饋過的要從修正結果判斷狀態
      if (e.feedback) {
        return e.feedback['statusTo'] === actionV // statusTo == true 代表請換刀
      } else {
        return e['needChangeBlade'] === actionV
      }
    })

  window.scrollTo(0, 0);
  currentPage.value = 1;
}

const handleShowModal = (item) => {
  modalItem.value = item
  isModalActive.value = true
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage;

  window.scrollTo(0, 0);
}

const recordList = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = currentPage.value * perPage;

  // 從資料中擷取對應的資料範圍
  return filterShowResults(predictionStore.predictionResults).slice(start, end);
})

const filterShowResults = (predictionResults) => {
  const filterTagList = [];

  if (isShowOffline.value) {
    filterTagList.push('淘汰', '閒置')
  }

  if (isShowOnline.value) {
    filterTagList.push('換角', '更新', '架機')
  }

  return predictionResults.filter(item => {
    return filterTagList.includes(item['刀片狀態'])
  })
}

const updateFeedback = async () => {
  const bladeSpecification = modalItem.value['刀片規格']
  const bladeHolderID = modalItem.value['刀柄編號']
  const machineID = modalItem.value['機台']
  const needChangeBlade = modalItem.value['needChangeBlade']
  const skipCycle = modalAlertCycle.value
  const expireTime =
    skipCycle !== 0 ? calculateCycle(modalItem.value.alertCycle, skipCycle - 1) : ''
  const tag = modalItem.value['tag']

  const r = await predictionStore.updateFeedback(
    bladeSpecification,
    bladeHolderID,
    machineID,
    needChangeBlade,
    skipCycle,
    expireTime,
    tag
  )
  if (r === 'success') {
    ElNotification({
      title: `機台 ${machineID} 已修正`,
      message: '',
      type: 'success'
    })
  } else {
    ElNotification({
      title: `機台 ${machineID} 修正失敗`,
      message: '',
      type: 'error'
    })
  }
  resetModal()

  // window.location.reload()
  predictionStore.getPredictionResult().then(() => {
    itemsPaginated.value = filterShowResults(predictionStore.predictionResults);
    filerIDOptions.value = [
      '全部',
      ...new Set(predictionStore.predictionResults.map((e) => e['機台']))
    ]
  })
}

const resetModal = () => {
  isModalActive.value = false
  modalItem.value = null
  modalAlertCycle.value = 0
}

const calculateCycle = (date, n) => {
  const cycleHours = [9, 13] // 一天中的两个周期时间点
  const startDate = new Date(date)
  const startHour = startDate.getHours()

  // 确定当前时间是在哪个周期内，或者是下一个周期的开始
  let cycleIndex = cycleHours.findIndex((hour) => startHour < hour)
  if (cycleIndex === -1) {
    // 如果当前时间超过了当天的最后一个周期，转到下一天的第一个周期
    cycleIndex = 0
    startDate.setDate(startDate.getDate() + 1)
  }

  // 计算经过 n 个周期后的总天数和最终周期的索引
  const totalDays = Math.floor((n + cycleIndex) / cycleHours.length)
  const finalCycleIndex = (n + cycleIndex) % cycleHours.length
  // 调整最终日期和时间
  const finalDate = new Date(startDate)
  finalDate.setDate(finalDate.getDate() + totalDays)
  finalDate.setHours(cycleHours[finalCycleIndex], 0, 0, 0) // 设置小时，分钟，秒和毫秒为 0

  return formatDateWithTimezone(finalDate)
}

const getTrClass = (item) => {
  if (item.feedback !== undefined) {
    return ['']
  }

  return [item.needChangeBlade ? '!bg-red-100 hover:!bg-red-200 dark: text-black' : '']
}

onMounted(() => {
  predictionStore.getPredictionResult().then(() => {
    

    itemsPaginated.value = filterShowResults(predictionStore.predictionResults);
    filerIDOptions.value = [
      '全部',
      ...new Set(predictionStore.predictionResults.map((e) => e['機台']))
    ]
  })
})
</script>
