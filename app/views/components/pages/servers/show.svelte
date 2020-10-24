<script>
export let server
import { page } from 'inertia-svelte'
</script>

<h2>{server.name}</h2>

{#if $page.flash.bot_added}
<div class="well">
  Thank you for installing SimpWars on your server.<br>
  The admin settings are under contruction. Please come back here later.
</div>
{/if}
