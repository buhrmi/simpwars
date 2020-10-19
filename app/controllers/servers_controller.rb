class ServersController < ApplicationController
  def show
    server = Server.find(params[:id])

    render inertia: 'servers/show', props: {
      server: server.to_prop
    }
  end
end
