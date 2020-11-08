<script>
  import { inertia } from 'inertia-svelte'
  import currentUser from 'user'
  export let servers
</script>

<p>Welcome to SimpWars. This game is in early development. Data might be occasionally reset without any prior announcement.</p>

<h2>You can play SimpWars on the following servers</h2>


{#each servers as server}
  <a use:inertia href="/servers/{server.id}">  
    <div class="server">
      {server.name}
    </div>
  </a>
{/each}

<br>or
<a href="/auth/discord?bot=1{$currentUser ? '' : '&identify=1'}">add your own server</a> 