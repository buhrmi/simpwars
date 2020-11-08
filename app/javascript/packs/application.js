// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

// Give CSRF token to Axios
import Axios from 'axios'
const tag = document.querySelector('meta[name=csrf-token]')
if (tag) Axios.defaults.headers.common['X-CSRF-TOKEN'] = tag.content;

// Init Inertiajs
import { InertiaApp } from 'inertia-svelte'
const app = document.getElementById('app')
new InertiaApp({
  target: app,
  props: {
    initialPage: JSON.parse(app.dataset.page),
    resolveComponent: name => import(`components/pages/${name}.svelte`).then(module => module.default),
    resolveLayout: name => require(`components/layouts/${name}.svelte`).default,
    transformProps: props => props
  },
})

require('./utils')

// Websockets
require('../channels')