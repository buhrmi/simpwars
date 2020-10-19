class SessionsController < ApplicationController
  def create
    user = User.find_or_create_from_discord(auth_hash)
    session[:user_id] = user.id
    
    # If the guild_id is set, it means that the user added our bot to that guild/server
    if params[:guild_id]
      server = Server.where(discord_id: params[:guild_id]).first_or_initialize
      server.admin_user = current_user
      server.save!
      redirect_to server
    else
      redirect_to current_user
    end
    
  end
  
  def destroy
    session[:user_id] = nil
    redirect_to root_url
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end
end