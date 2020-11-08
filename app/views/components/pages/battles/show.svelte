<script>
import { inertia } from 'inertia-svelte'
export let battle
import Info from 'components/PlayerInfo.svelte'
</script>

<h2>
  <Info player={battle.attacker} />
  vs
  <Info player={battle.defender} />
</h2>

This battle took place on <a href={battle.server.url}>{battle.server.name}</a>

<h2>Battle Results</h2>

<p>Coming soon</p>