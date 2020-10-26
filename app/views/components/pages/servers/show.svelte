<script>
export let server
export let players
import { page, inertia } from 'inertia-svelte'
</script>

<h2>{server.name}</h2>

<h3>Server ranking</h3>
{#each players as player, index}
  <div class="row">
    {index + 1}. <a use:inertia href="/users/{player.id}">{player.name}</a>
  </div>
{/each}

{#if $page.flash.bot_added}
<div class="well">
  Thank you for installing SimpWars on your server.<br>
  The admin settings are under contruction. Please come back here later.
</div>
{/if}
