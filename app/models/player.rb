class Player < ApplicationRecord
  include Attackable

  belongs_to :user
  belongs_to :server

  delegate :discord_id, to: :user
  
  def self.from_discord discord_id, server
    user = User.where(discord_id: discord_id).first_or_create(server: server)

    where(user: user).first_or_create(name: user.name)
  end

  def to_prop incl_private=false
    prop = {
      id: id,
      name: name,
      exp: exp,
      level: level,
      current_hp: current_hp,
      max_hp: max_hp
    }
    if incl_private
      prop[:coin] = coin
    end
    prop
  end
end
