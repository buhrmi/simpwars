<script>
  import currentPlayer from 'player'
  import currentUser from 'user'
</script>

{#if $currentPlayer}
  <div class="player_overview">
    <div class="portrait">
      <img src={$currentUser.profile_image} alt="{$currentPlayer.name}">
    </div>
    <div class="level">{$currentPlayer.level}</div>
    <div class="hpbar">
      <div class="fill" style="width: {100 * $currentPlayer.current_hp / $currentPlayer.max_hp}%"></div>
      
      {$currentPlayer.current_hp} / {$currentPlayer.max_hp}
    </div>
    <div class="name">
      {$currentPlayer.name}
    </div>
    <div class="coin">Coin: {$currentPlayer.coin}</div>
    <div class="exp">Exp: {$currentPlayer.exp}</div>
    
  </div>
{/if}


<style>
.player_overview {
  position: relative;
  width: 100%;
}
.portrait {
  position: relative;
  height: 90px;
  width: 90px;
  border: 1px solid black;
  border-radius: 100px;
  overflow: hidden;
}
.name {
  position: absolute;
  left: 100px;
  top: 15px;
}
.hpbar {
  width: 170px;
  height: 18px;
  border: 1px solid black;
  color: white;
  position: absolute;
  top: 35px;
  left: 95px;
  text-align: center;
}
.hpbar .fill {
  position: absolute;
  height: 100%;
  background-color: #cc2222;
  z-index: -1;
}

.level {
  position: absolute;
  border: 1px solid black;
  border-radius: 30px;
  height: 25px;
  width: 25px;
  text-align: center;
  line-height: 25px;
  font-weight: bold;
  top: 0px;
  left: 70px;
  background: white;
}
.coin {
  position: absolute;
  left: 100px;
  top: 65px;
}
.exp {
  position: absolute;
  left: 180px;
  top: 65px;
}

</style>