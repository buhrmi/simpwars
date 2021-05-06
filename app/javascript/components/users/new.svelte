<script>
  import { page, inertia } from '@inertiajs/inertia-svelte'
</script>

{#if !$page.current_user} 
  <a href="/auth/discord?identify=1">JOIN SIMPWARS</a> 
{/if}


