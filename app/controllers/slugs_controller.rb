class SlugsController < ApplicationController
  def show
    render inertia: "slugs/#{params[:slug]}"
  end
end