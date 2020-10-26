<script>
import { Inertia } from '@inertiajs/inertia'
import { page } from 'inertia-svelte'

export let user
</script>

<h2>{user.name}</h2>
Level: {user.level}
HP: {Math.floor(user.current_hp)}/{user.max_hp}