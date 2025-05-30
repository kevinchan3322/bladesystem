<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { mdiAccount, mdiAsterisk, mdiGoogle } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'

import { useUserStore } from '@/stores/user.store'

const form = reactive({
  login: '',
  pass: ''
})

const router = useRouter()

const userStore = useUserStore()

const submit = async () => {
  const r = await userStore.login(form.login, form.pass)

  if (r === true) {
    router.push('/')
  }
}

const loginWithGoogle = async () => {
  const r = await userStore.loginWithGoogle()
  if (r === true) {
    router.push('/')
  }
}
</script>

<template>
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="purplePink">
      <CardBox :class="cardClass" is-form @submit.prevent="submit">
        <div class="flex flex-col items-center">
          <div class="w-[145px] flex flex-col gap-3">
            <img src="/public/logo.svg" alt="Description of the image" />
            <p style="font-size: 20px; font-weight: 400; line-height: 24.2px; text-align: center">
              AI 刀具警示系統
            </p>
          </div>
        </div>
        <FormField label="帳號">
          <FormControl
            v-model="form.login"
            :icon="mdiAccount"
            name="login"
            required
            autocomplete="username"
          />
        </FormField>

        <FormField label="密碼">
          <FormControl
            v-model="form.pass"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            required
            autocomplete="current-password"
          />
        </FormField>

        <template #footer>
          <BaseButtons>
            <BaseButton type="submit" color="info" label="登入" />
            <BaseButton
              type="button"
              color="info"
              :icon="mdiGoogle"
              label="使用 Google 登入"
              outline
              @click="loginWithGoogle"
            />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>
