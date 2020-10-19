class DiscordInteractionsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    head 200
  end
end