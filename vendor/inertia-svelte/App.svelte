<script>
  // Note by buhrmi:
  // The inertia-svelte repo is at github.com/inertiajs/inertia-svelte
  // The code here has been copied and modified to add a persistent layout function
  // Pullrequest pending.

  import { Inertia } from '@inertiajs/inertia'
  import store from './store'
  import empty from './empty.svelte'

  export let
    initialPage,
    resolveComponent,
    resolveLayout,
    transformProps = props => props

  Inertia.init({
    initialPage,
    resolveComponent,
    resolveLayout,
    updatePage: (component, props, { preserveState }) => {
      store.update(page => ({
        layout: props.layout ? resolveLayout(props.layout) : empty,
        component,
        key: preserveState ? page.key : Date.now(),
        props: transformProps(props),
      }))
    },
  })
</script>

<svelte:component this={$store.layout} {...$store.props} >
  {#each [$store.key] as key (key)}
    <svelte:component this={$store.component} {...$store.props} />
  {/each}
</svelte:component>
