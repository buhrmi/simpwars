<script>
import { inertia } from 'inertia-svelte'
export let battle
import Info from 'components/userinfo.svelte'
</script>

<h2>
  <Info user={battle.attacker} />
  vs
  <Info user={battle.defender} />
</h2>

This battle took place on <a href={battle.server.url}>{battle.server.name}</a>

<h2>Battle Results</h2>

<p>Coming soon</p>