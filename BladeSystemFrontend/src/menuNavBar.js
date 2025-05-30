import { mdiLogout } from '@mdi/js'

export default [
  {
    isCurrentUser: true,
    isDesktopNoLabel: false,
    isLogout: false
  },
  {
    icon: mdiLogout,
    label: 'Log out',
    isDesktopNoLabel: true,
    isLogout: true
  }
]
