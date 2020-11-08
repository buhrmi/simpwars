<script>
import { inertia } from 'inertia-svelte'
export let player
</script>

<div class="playerinfo">
  <a use:inertia href={player.url}>
    <div class="portrait">
      <img src={player.profile_image}>
    </div>
    {player.name}
  </a>
</div>

<style>
  .playerinfo {
    display: inline-block;
  }
  .portrait {
    display: inline-block;
    border-radius: 100px;
    overflow: hidden;
    vertical-align: middle;
    border: 1px solid #eee;
    width: 40px;
    height: 40px;
  }
  img {
    height: 100%;
    width: 100%;
  }

</style>