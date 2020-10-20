<script>
  import { page, inertia } from 'inertia-svelte'
</script>




<div class="container">
  <h1>SimpWars <span>Alpha</span></h1>

  {#if $page.current_user}
    <div class="character_overview">
      <div class="portrait">
        <img src={$page.current_user.profile_image} alt="{$page.current_user.name}">
      </div>
      
      <div class="stats">
        <h1 class="name">{$page.current_user.name}</h1>
        
      </div>
      
      <div class="user_menu">
        <a use:inertia={{method: 'DELETE'}} href="/session">Log out</a>
      </div>
    </div>
  {/if}

  <slot />

  <footer>
    Copyright 2020 buhrmi games | <a href="/auth/discord?bot=1{$page.current_user ? '' : '&identify=1'}">Add Server</a> | <a use:inertia href="/credits">Credits</a> | <a href="https://discord.com/invite/ykcXJgx" target="_blank">Discord</a>
  </footer>
</div>

<style>

h1 span {
  font-size: 0.5em;
  font-weight: normal;
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