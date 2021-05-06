// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

// Give CSRF token to Axios
import Axios from 'axios'
const tag = document.querySelector('meta[name=csrf-token]')
if (tag) Axios.defaults.headers.common['X-CSRF-TOKEN'] = tag.content;
import Layout from 'components/layout.svelte'
// Init Inertiajs
import { InertiaApp } from '@inertiajs/inertia-svelte'
const app = document.getElementById('app')
new InertiaApp({
  target: app,
  props: {
    initialPage: JSON.parse(app.dataset.page),
    resolveComponent: name => import(`components/${name}.svelte`).then(function(page) {
      if (page.layout === undefined) {
        page.layout = Layout
      }
      return page
    })
  }
})

require('./utils')

// Websockets
require('../channels')