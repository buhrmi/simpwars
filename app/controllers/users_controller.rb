class UsersController < ApplicationController
  def show
    @title_object = user = User.find(params[:id])

    render inertia: 'users/show', props: {
      
    }
  end

  def new
    return redirect_to root_url if current_user

    render inertia: 'users/new', props: {
    }
  end

end