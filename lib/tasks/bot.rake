# frozen_string_literal: true

# This simple bot responds to every "Ping!" message with a "Pong!"

namespace :discord do
  desc 'Runs the discord bot'
  task bot: :environment do

    # This statement creates a bot with the specified token and application ID. After this line, you can add events to the
    # created bot, and eventually run it.
    #
    # If you don't yet have a token to put in here, you will need to create a bot account here:
    #   https://discordapp.com/developers/applications
    # If you're wondering about what redirect URIs and RPC origins, you can ignore those for now. If that doesn't satisfy
    # you, look here: https://github.com/discordrb/discordrb/wiki/Redirect-URIs-and-RPC-origins
    # After creating the bot, simply copy the token (*not* the OAuth2 secret) and put it into the
    # respective place.
    bot = Discordrb::Bot.new token: ENV['DISCORD_BOT_TOKEN']
    
    # This method call adds an event handler that will be called on any message that exactly contains the string "Ping!".
    # The code inside it will be executed, and a "Pong!" response will be sent to the channel.
    bot.message(start_with: '!attack ') do |event|
      message = event.message
      author = message.author
      channel = message.channel
      server = Server.where(discord_id: event.server.id).first_or_create
      attacker = User.from_discord_author author
      params = message.content.gsub('!attack ', '')
      match = params.match('<@!(\d*)>')
      if match && defender_id = match[1]
        defender = User.where(discord_id: defender_id).first_or_create
        battle = Battle.new
        battle.attacker = attacker
        battle.defender = defender
        battle.server = server
        battle.execute!
        event.respond battle.discord_info
      end
    end
    
    # This method call has to be put at the end of your script, it is what makes the bot actually connect to Discord. If you
    # leave it out (try it!) the script will simply stop and the bot will not appear online.
    bot.run 
  end
end