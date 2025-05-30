<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton title="資料下載" main>
        <!-- 用來隱藏預設 icon 的 -->
        <div></div>
      </SectionTitleLineWithButton>
      <table>
        <thead>
          <tr>
            <th>檔案</th>
            <th>建立日期</th>
            <th>下載</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in itemsPaginated" :key="`${item.filename} + '_' + ${i}`">
            <td data-label="檔案">
              {{ item.filename }}
            </td>
            <td data-label="建立日期">
              {{ item.createDatetime }}
            </td>
            <td data-label="下載">
              <BaseIcon
                v-if="item.createDatetime !== ''"
                :path="mdiDownload"
                class="hover: cursor-pointer"
                size=""
                @click="download(item.filename)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </SectionMain>
  </LayoutAuthenticated>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { usePredictionStore } from '@/stores/prediction'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import { mdiDownload } from '@mdi/js'
import BaseIcon from '@/components/BaseIcon.vue'
import ExcelJs from 'exceljs'

const predictionStore = usePredictionStore()
const itemsPaginated = ref([
  {
    filename: '工單',
    createDatetime: ''
  },
  {
    filename: '報工紀錄',
    createDatetime: ''
  },
  {
    filename: '換刀紀錄',
    createDatetime: ''
  },
  {
    filename: '刀柄規格',
    createDatetime: ''
  },
  {
    filename: '補刀紀錄',
    createDatetime: ''
  },
  {
    filename: '刀片規格',
    createDatetime: ''
  },
  {
    filename: '加工任務規格',
    createDatetime: ''
  },
  {
    filename: '加工零件規格',
    createDatetime: ''
  }
])

const download = async (name) => {
  const data = await predictionStore.downloadFile(name)

  const workbook = new ExcelJs.Workbook() // 創建試算表檔案
  const sheet = workbook.addWorksheet(name) //在檔案中新增工作表 參數放自訂名稱

  const columns = Object.keys(data[0]).map((k) => {
    return {
      name: k
    }
  })

  const rows = data.map((d) => {
    const output = []

    Object.keys(d).forEach((k) => output.push(d[k]))

    return output
  })

  sheet.addTable({
    name: `${name}`,
    ref: 'A1', // 從A1開始
    columns: columns,
    rows: rows
  })

  workbook.xlsx.writeBuffer().then((content) => {
    const link = document.createElement('a')
    const blobData = new Blob([content], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    })
    link.download = `${name}.xlsx`
    link.href = URL.createObjectURL(blobData)
    link.click()
  })
}

onMounted(() => {
  predictionStore.getCurrentCycle().then(() => {
    let utcDate = ''
    if (predictionStore.cycleDate) {
      utcDate = new Date(predictionStore.cycleDate).toLocaleString()
    }

    itemsPaginated.value.forEach((i) => (i.createDatetime = utcDate))
  })
})
</script>
