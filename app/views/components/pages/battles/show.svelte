<script>
import { inertia } from 'inertia-svelte'
export let battle
</script>

<h2>
  <a use:inertia href={battle.attacker.url}>{battle.attacker.name}</a>
  vs
  <a use:inertia href={battle.defender.url}>{battle.defender.name}</a>
</h2>

Coming soon.