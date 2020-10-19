import { Inertia, shouldIntercept } from '@inertiajs/inertia'

export default function inertia(node, options) {

  function handleClick(event) {
    if (shouldIntercept(event)) {
      event.preventDefault()
      Inertia.visit(node.href, options)
    }
  }
  node.addEventListener('click', handleClick)

  return {
    update(newOptions) {
      options = newOptions
    },
    destroy() {
      node.removeEventListener('click', handleClick);
    }
  }
}