class ServersController < ApplicationController
  def show
    server = Server.find(params[:id])

    render inertia: 'servers/show', props: {
      server: server.to_prop,
      players: server.users.order('honor desc').map(&:to_prop)
    }
  end
end
