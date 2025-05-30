import { createRouter, createWebHistory } from 'vue-router'
import { getLocalStageData } from '../utils'

const routes = [
  {
    path: '/',
    redirect: () => {
      return { path: '/blade-prediction-result' }
    }
  },
  {
    meta: {
      title: '刀片預測',
      authRequired: true
    },
    path: '/blade-prediction-result',
    name: 'blade-prediction-result',
    component: () => import('@/views/BladePredictionResult.vue')
  },
  {
    meta: {
      title: '刀片加工履歷',
      authRequired: true
    },
    path: '/blade-prediction',
    name: 'blade-prediction',
    component: () => import('@/views/BladePrediction.vue')
  },
  {
    meta: {
      title: '資料下載',
      authRequired: true
    },
    path: '/review-data',
    name: 'review-data',
    component: () => import('@/views/ReviewData.vue')
  },
  {
    meta: {
      title: '修改密碼',
      authRequired: true
    },
    path: '/account-password',
    name: 'account-password',
    component: () => import('@/views/AccountPassword.vue')
  },
  {
    meta: {
      title: '用戶操作紀錄',
      authRequired: true
    },
    path: '/account-log',
    name: 'account-log',
    component: () => import('@/views/AccountLog.vue')
  },
  {
    meta: {
      title: '登入'
    },
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    beforeEnter: (to, from, next) => {
      const token = getLocalStageData('token')

      if (token) {
        next({ path: '' })
      } else {
        next()
      }
      return
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const { authRequired } = to.meta
  const token = getLocalStageData('token')

  if (!authRequired) {
    next()
    return
  }

  if (!token) {
    next({ name: 'login' })
  } else {
    next()
  }

  return
})

export default router
