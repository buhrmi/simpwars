<script>
  import { page, inertia } from 'inertia-svelte'
</script>

{#if !$page.current_user} 

<a href="/auth/discord?bot=1">Install on your Server</a> 

  or <a href="/auth/discord?identify=1">Log In</a> 
{/if}


