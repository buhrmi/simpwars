<script>
import user from 'user'
</script>

{#if $user}
You don't have anything on you.
{:else}
Not logged in.
{/if}