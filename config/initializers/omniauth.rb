Rails.application.config.middleware.use OmniAuth::Builder do
  provider :twitch, ENV["TWITCH_CLIENT_ID"], ENV["TWITCH_CLIENT_SECRET"]
  provider :discord, ENV['DISCORD_CLIENT_ID'], ENV['DISCORD_CLIENT_SECRET'],
    setup: lambda { |env| 
      request = ActionDispatch::Request.new(env)
      scope = []
      if request.GET['identify']
        scope << 'identify' 
      end
      if request.GET['bot']
        scope << 'bot' 
      end
      
      env['omniauth.strategy'].options.merge!(scope: scope.join(' '))
    }
  # provider :twitter, ENV["TWITTER_API_KEY"], ENV["TWITTER_SECRET_KEY"]
end