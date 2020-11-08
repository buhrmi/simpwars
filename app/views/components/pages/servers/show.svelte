<script>
export let server
export let players
import { page, inertia } from 'inertia-svelte'
import PlayerOverview from 'components/PlayerOverview.svelte'
import player from '../../../../javascript/player'
</script>

{#if $page.flash.bot_added}
<div class="well">
  Thank you for installing SimpWars on your server.<br>
  Settings page is under contruction. Please come back here later.
</div>
{/if}

<h2>{server.name}</h2>
  
<PlayerOverview />

<h3>Top Players</h3>
{#each players as player, index}
  <div class="row">
    {index + 1}. <a use:inertia href="/servers/{player.server.id}/players/{player.id}">{player.name}</a>
  </div>
{/each}

