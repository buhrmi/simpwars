<script>
  import { page, inertia } from 'inertia-svelte'
</script>

{#if !$page.current_user} 
<p>
  An evil lord has emerged and is turning the people of Discordia into simps.<br>
  Heed the call of the Serverlords and restore honor and glory to their kingdom.<br>
</p>

<a href="/auth/discord?bot=1">Install on your Server</a> 

  or <a href="/auth/discord?identify=1">Log In</a> 
{/if}


