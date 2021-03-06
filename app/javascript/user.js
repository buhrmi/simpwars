import { writable } from 'svelte/store'
import { page } from '@inertiajs/inertia-svelte'

const user = writable({})
page.subscribe(function(pageProps) {
  user.set(pageProps.current_user)
})

export default user