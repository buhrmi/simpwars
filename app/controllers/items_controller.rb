class ItemsController < ApplicationController
  def index
    render inertia: 'items/index'
  end
end