class SessionsController < ApplicationController
  def create
    user = User.from_discord(auth_hash)
    cookies.signed[:user_id] = user.id
    
    # If the guild_id is set, it means that the user added our bot to that guild/server
    if params[:guild_id]
      server = Server.where(discord_id: params[:guild_id]).first_or_initialize
      server.admin_user = current_user
      server.save!
      flash[:bot_added] = true
      redirect_to server
      current_user.server = server
      current_user.save
    else
      redirect_to current_user
    end
  end

  def update
    cookies.signed[:player_id] = params[:player_id]
    redirect_to root_url
  end
  
  def destroy
    cookies.signed[:user_id] = nil
    redirect_to root_url
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end
end