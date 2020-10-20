<script>
  import { page, inertia } from 'inertia-svelte'
</script>

<p>
  SimpWars is an in-development browser-based multiplayer game created by buhrmi.
</p>

{#if !$page.current_user}
  <a href="/auth/discord?identify=1">Log In</a> 
{/if}


