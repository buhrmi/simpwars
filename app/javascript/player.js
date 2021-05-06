import { writable } from 'svelte/store'
import { page } from '@inertiajs/inertia-svelte'

const player = writable({})
page.subscribe(function(pageProps) {
  player.set(pageProps.current_player)
})

export default player