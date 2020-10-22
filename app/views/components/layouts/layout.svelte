<script>
  import { inertia } from 'inertia-svelte'
  import currentUser  from 'user'
</script>




<div class="container">
  
  {#if $currentUser}
    <div class="character_overview">
      <div class="portrait">
        <img src={$currentUser.profile_image} alt="{$currentUser.name}">
      </div>
      
      <div class="stats">
        <h1 class="name">{$currentUser.name}</h1>
        <p>Coin: {$currentUser.coin}</p>
        <p>Honor: {$currentUser.honor}</p>
      </div>
      
      <div class="user_menu">
        <a use:inertia={{method: 'DELETE'}} href="/session">Log out</a>
      </div>
    </div>
  {:else}
    <h1><a use:inertia href="/">SimpWars <span>Alpha</span></a></h1>
  {/if}

  <slot />

  <footer>
    Copyright 2020 buhrmi games | <a href="/auth/discord?bot=1{$currentUser ? '' : '&identify=1'}">Add Server</a> | <a use:inertia href="/credits">Credits</a> | <a href="https://discord.com/invite/ykcXJgx" target="_blank">Discord</a>
  </footer>
</div>

<style>

h1 span {
  font-size: 0.5em;
  font-weight: normal;
}

h1 a {
  color: black !important;
  text-decoration: none !important;
}

footer {
  margin-top: 30px;
  padding-top: 10px;
  border-top: 1px solid black;
}
.container {
  margin: 0 auto;
  width: 100%;
}
@media screen and (min-width: 1022px) {
  .container {
    margin: 0 auto;
    width: 1022px;
  }
}
.character_overview {
  display: grid;
  grid-template-columns: 150px auto 150px;
}
</style>