const { environment } = require('@rails/webpacker')
const svelte = require('./loaders/svelte')
const babelOptions = environment.loaders.get('babel').use[0].options

environment.loaders.prepend('svelte', svelte)

// Insert rb2js loader at the end of list
environment.loaders.append('rb2js', {
  // test: /\.js\.rb$/,
  test: /\.rb$/,
  use: [
    {
      loader: "babel-loader",
      options: {...babelOptions}
    },
    "rb2js-loader"
  ]
})

module.exports = environment
