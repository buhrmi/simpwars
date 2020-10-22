# SimpWars

Join the epic battle of the simps. Only on https://simpwars.net.

## Developers

**This sections deals with developing SimpWars itself.**
To run the game locally or on your own server, you need to install some dependencies.

### Dependencies

Execute `# bundle install` to install Ruby gems (including Rails itself).
Execute `# yarn install` to install Javascript/NodeJS packages.

Depending on what is already installed on your OS or not, you might need to install a few system packages to be able to have everything working.

#### libsodium

The `discordrb` gem depends on `libsodium` for encrypted communication with discord.

* on Debian : `# apt install libsodium-dev`.
* on macOS with Homebrew : `# brew install libsodium`.

### Running

Once everything is installed, you should be able to run the web server with

```
rails s
```

and the Discord bot with

```
rake discord:bot
```