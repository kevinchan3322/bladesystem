<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton title="用戶操作紀錄" main>
        <NavBarItemPlain use-margin class="flex gap-5">
          <FormControl
            v-model="filterAccount"
            class="min-w-[150px]"
            :options="filterAccountOptions"
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
      <table>
        <thead>
          <tr>
            <th>編號</th>
            <th>使用者帳號</th>
            <th>時間</th>
            <th>操作行為</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in itemsPaginated" :key="`${item.account} + '_' + ${i}`">
            <td data-label="編號">
              {{ getIDNumber(i) }}
            </td>
            <td data-label="使用者帳號">
              {{ item.account }}
            </td>
            <td data-label="時間">
              {{ toLocaltime(item.createdAt) }}
            </td>
            <td data-label="操作行為">
              {{ item.action }}
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import NavBarItemPlain from '@/components/NavBarItemPlain.vue'
import FormControl from '@/components/FormControl.vue'

import { useUserLogStore } from '@/stores/userLog.store'

const filterAccountOptions = ref([])
const filterActionOptions = ref([])
const filterAccount = ref('全部')
const filterAction = ref('全部')

const userLogStore = useUserLogStore()

const currentPage = ref(userLogStore.meta.current_page)
const totalPage = computed(() => userLogStore.meta.total_page)
const itemsPaginated = computed(() => userLogStore.logList)

const toLocaltime = (datetime) => {
  const utcDate = new Date(datetime)
  const localDate = utcDate.toLocaleString()

  return localDate
}

const getIDNumber = (i) => {
  if (currentPage.value !== 1) {
    return i + 1 + (currentPage.value - 1) * userLogStore.limit
  }

  return i + 1
}

const handlePageChange = (newPage) => {
  userLogStore.getLogList(newPage, userLogStore.limit, filterAccount.value, filterAction.value)
  window.scrollTo(0, 0)
}

const handleChangeFilter = () => {
  userLogStore.getLogList(1, userLogStore.limit, filterAccount.value, filterAction.value)
}

onMounted(() => {
  userLogStore.getLogList(1, userLogStore.limit)
  userLogStore.getFilterOptions()
})

watch(
  () => userLogStore.meta.current_page,
  (newPage) => {
    currentPage.value = newPage
  }
)

watch(
  () => userLogStore.filterAccountOptions,
  (options) => {
    filterAccountOptions.value = options
  }
)
watch(
  () => userLogStore.filterActionOptions,
  (options) => {
    filterActionOptions.value = options
  }
)
</script>
