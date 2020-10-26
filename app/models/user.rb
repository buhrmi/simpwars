require 'open-uri'

class User < ApplicationRecord
  include Attackable

  has_one_attached :profile_image

  before_create :fetch_details
  after_save_commit :broadcast_changes
  
  belongs_to :server, optional: true

  def broadcast_changes
    UsersChannel.broadcast_to(self, update: to_prop(true) )
  end
  
  def fetch_details
    res = Discordrb::API::User.resolve('Bot ' + ENV['DISCORD_BOT_TOKEN'], self.discord_id)
    user = JSON.parse res.body
    self.name = user['username']
    if user['avatar']
      image = open "#{Discordrb::API::CDN_URL}/avatars/#{discord_id}/#{user['avatar']}.png"
      self.profile_image.attach(io: image, filename: "avatar.jpg")
    end
  end


  def self.from_discord_author author, server
    where(discord_id: author.id).first_or_create(name: author.name, server: server)
  end

  def self.from_discord auth_hash
    user = User.where(discord_id: auth_hash[:uid]).first_or_create
    
    if auth_hash['info']['image']
      image = open auth_hash['info']['image']
      user.profile_image.attach(io: image, filename: "avatar.jpg")
    end
    
    user.update!(
      name: auth_hash['info']['name'],
      email: auth_hash['info']['email'],
      nickname: auth_hash['info']['nickname'],
      description: auth_hash['info']['description']
    )
    user
  end

  def self.from_twitch auth_hash
    
    user = User.where(twitch_id: auth_hash[:uid]).first_or_create
    
    if auth_hash['info']['image']
      image = open auth_hash['info']['image']
      user.profile_image.attach(io: image, filename: "avatar.jpg")
    end
    
    user.update!(
      name: auth_hash['info']['name'],
      email: auth_hash['info']['email'],
      nickname: auth_hash['info']['nickname'],
      description: auth_hash['info']['description']
    )
    user
  end

  def profile_image_thumbnail
    if profile_image.attached?
      Rails.application.routes.url_helpers.rails_representation_url profile_image.variant(resize: '100x100'), only_path: true
    end
  end

  def to_prop(incl_private=false)
  
    prop = {
      id: id,
      name: name,
      description: description,
      profile_image: profile_image_thumbnail,
      url: Rails.application.routes.url_helpers.user_url(self, only_path: true),
      honor: honor,
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
