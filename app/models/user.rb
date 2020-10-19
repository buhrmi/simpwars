require 'open-uri'

class User < ApplicationRecord
  has_one_attached :profile_image

  def self.from_discord_author author
    puts author.inspect
    where(discord_id: author.id).first_or_create(name: author.name)
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
    Rails.application.routes.url_helpers.rails_representation_url profile_image.variant(resize: '100x100'), only_path: true
  end

  def to_prop
    {
      id: id,
      name: name,
      description: description,
      profile_image: profile_image_thumbnail,
      url: Rails.application.routes.url_helpers.user_url(self, only_path: true)
    }
  end


end
