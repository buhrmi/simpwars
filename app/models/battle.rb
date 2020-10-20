class Battle < ApplicationRecord
  belongs_to :attacker, polymorphic: true
  belongs_to :defender, polymorphic: true
  belongs_to :server, optional: true

  def to_prop
    {
      name: name,
      results: results,
      attacker: attacker.to_prop,
      defender: defender.to_prop
    }
  end

  def execute!
    self.results = {}
    save!
  end
  

  def name
    "#{attacker.name} vs #{defender.name}"
  end

  def discord_info
    url = Rails.application.routes.url_helpers.battle_url(self)
    "<@!#{attacker.discord_id}> sees <@!#{defender.discord_id}> and attacks! Results: #{url}"
  end
end
