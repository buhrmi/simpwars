class UsersChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    UsersChannel.broadcast_to(User.first, update: {gold: 123})
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
