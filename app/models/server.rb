class Server < ApplicationRecord
  has_one_attached :icon

  belongs_to :admin_user, class_name: 'User', optional: true
  has_many :users
  
  before_create :fetch_info

  def fetch_info
    res = Discordrb::API::Server.resolve('Bot ' + ENV['DISCORD_BOT_TOKEN'], self.discord_id)
    server = JSON.parse res.body
    self.name = server['name']
    if server['icon']
      icon = open "#{Discordrb::API::CDN_URL}/icons/#{self.discord_id}/#{server['icon']}.png"
      self.icon.attach(io: icon, filename: "avatar.jpg")
    end
  end

  def to_prop
    {
      name: name,
      admin: admin_user.try(:to_prop),
      url: Rails.application.routes.url_helpers.server_url(self, only_path: true)
    }
  end
end
