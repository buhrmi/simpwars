class ServersController < ApplicationController
  def show
    server = Server.find(params[:id])
    if current_user
      player = current_user.players.where(server: server).first
      if !player
        player = Player.from_discord current_user.discord_id, server
      end
      cookies.signed[:player_id] = player.id
    end
    render inertia: 'servers/show', props: {
      server: server.to_prop,
      players: server.players.order('exp desc').map(&:to_prop)
    }
  end

  def index
    servers = Server.all

    render inertia: 'servers/index', props: {
      servers: servers.map(&:to_prop)
    }
  end
end
