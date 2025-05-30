<script setup>
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { mdiAsterisk, mdiFormTextboxPassword } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import { ElNotification } from 'element-plus'

const userStore = useUserStore()

const passwordForm = reactive({
  password_current: '',
  password: '',
  password_confirmation: ''
})

const submitPass = async () => {
  if (passwordForm.password !== passwordForm.password_confirmation) {
    ElNotification({
      title: '修改密碼錯誤',
      message: '請確認新密碼與確認新密碼欄位是否輸入正確',
      type: 'error'
    })
    return
  }

  const r = await userStore.changePassword(
    passwordForm.password_current,
    passwordForm.password_confirmation
  )

  if (r === true) {
    ElNotification({
      title: '修改密碼成功',
      message: '修改密碼成功，請重新登入',
      type: 'success'
    })
    userStore.logout()
    window.location.reload()
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton title="修改密碼" main>
        <!-- 用來隱藏預設 icon 的 -->
        <div></div>
      </SectionTitleLineWithButton>
      <CardBox is-form @submit.prevent="submitPass">
        <div class="flex flex-col max-w-xs">
          <FormField label="修改密碼" help="請填寫當前密碼">
            <FormControl
              v-model="passwordForm.password_current"
              :icon="mdiAsterisk"
              minlength="8"
              name="password_current"
              type="password"
              required
              autocomplete="current-password"
            />
          </FormField>

          <BaseDivider />

          <FormField label="新密碼" help="請填寫新密碼">
            <FormControl
              v-model="passwordForm.password"
              :icon="mdiFormTextboxPassword"
              minlength="8"
              name="password"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <FormField label="確認新密碼" help="請再次輸入新密碼">
            <FormControl
              v-model="passwordForm.password_confirmation"
              :icon="mdiFormTextboxPassword"
              minlength="8"
              name="password_confirmation"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>
        </div>

        <template #footer>
          <BaseButtons>
            <BaseButton type="submit" color="info" label="修改密碼" />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
