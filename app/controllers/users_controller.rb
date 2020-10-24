class UsersController < ApplicationController
  def show
    @title_object = user = User.find(params[:id])

    render inertia: 'users/show', props: {
      user: user.to_prop
    }
  end

  def new
    render inertia: 'users/new', props: {
    }
  end

end