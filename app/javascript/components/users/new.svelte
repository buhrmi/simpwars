<script>
  import { page, inertia } from '@inertiajs/inertia-svelte'
</script>

<p>
  SimpWars is a role playing game that can be installed on any Discord server.
</p>

{#if !$page.current_user} 
  <a href="/auth/discord?identify=1">JOIN SIMPWARS</a> 
{/if}


