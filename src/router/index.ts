import { createRouter, createWebHistory } from 'vue-router'
import MainaLayout from '@/layouts/maina-layout.vue'

const routes = [
  {
    path: '/',
    component: MainaLayout,
    children: [
      {
        path: '',
        name: 'record',
        component: () => import('@/pages/record-page.vue'),
      },
      {
        path: 'compare',
        name: 'compare',
        component: () => import('@/pages/compare-page.vue'),
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@/pages/history-page.vue'),
      },
      {
        path: 'history/:id',
        name: 'history-detail',
        component: () => import('@/pages/audio-detail-page.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/settings-page.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/pages/about-page.vue'),
      },
      {
        path: 'privacy',
        name: 'privacy',
        component: () => import('@/pages/privacy-page.vue'),
      },
      {
        path: 'contact',
        name: 'contact',
        component: () => import('@/pages/contact-page.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/not-found-page.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
