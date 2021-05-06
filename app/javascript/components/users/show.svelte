<script>
import currentUser from 'user'
import { page, inertia } from '@inertiajs/inertia-svelte'
export let players
export let user
</script>

{#if $currentUser && $currentUser.id == user.id}
  <h2>Hello {user.name}</h2>  
  {#if players.length}
    <p>You currently play on the following servers:</p>
    {#each players as player}
      <div class="server">  
        <a use:inertia href="/servers/{player.server.id}">{player.server.name}</a>
      </div>
    {/each}
  {:else}
    <p>You currently don't play on any server. Check out the <a use:inertia href="/servers">server list</a> to find a server.</p>
  {/if}
{:else}
  <h2>{user.name}</h2>
{/if}