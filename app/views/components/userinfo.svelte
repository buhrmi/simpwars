<script>
import { inertia } from 'inertia-svelte'
export let user
</script>

<div class="userinfo">
  <a use:inertia href={user.url}>
    <div class="portrait">
      <img src={user.profile_image}>
    </div>
    {user.name}
  </a>
</div>

<style>
  .userinfo {
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