import { createBrowserRouter } from 'react-router'
import { DashboardPage } from '@/routes/DashboardPage'
import { RootLayout } from '@/routes/RootLayout'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: RootLayout,
      children: [
        { index: true, Component: DashboardPage },
        // { path: 'login', lazy: () => import('@/routes/LoginPage') },
      ],
    },
  ],
  { basename: '/admin' },
)
