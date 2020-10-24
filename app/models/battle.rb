class Battle < ApplicationRecord
  belongs_to :attacker, polymorphic: true
  belongs_to :defender, polymorphic: true
  belongs_to :winner, polymorphic: true, optional: true

  belongs_to :server, optional: true

  serialize :results, HashSerializer

  def to_prop
    {
      name: name,
      results: results,
      attacker: attacker.to_prop,
      defender: defender.to_prop,
      server: server.to_prop
    }
  end

  def execute!
    # TODO: implement some real combat mechanics.
    attacker.remaining_hp = attacker.current_hp / 2
    defender.remaining_hp = 0
    
    self.winner = attacker



    won_coin = rand(12..22)
    won_honor = rand(22..25)
    winner.coin += won_coin
    winner.honor += won_honor
    attacker.last_hp = attacker.remaining_hp
    attacker.last_hp_updated_at = Time.now
    
    defender.last_hp = defender.remaining_hp
    defender.last_hp_updated_at = Time.now

    self.results = {
      attacker: {
        coin: won_coin,
        honor: won_honor
      }
    }
    winner.save!
    save!
  end

  def loser
    if attacker == winner
      defender
    else
      attacker
    end
  end

  def participants
    [attacker, defender]
  end

  def attacker_coin
    results[:attacker] && results[:attacker][:coin]
  end

  def attacker_honor
    results[:attacker] && results[:attacker][:honor]
  end

  def results_text
    text = "#{winner.name} wins the battle! #{loser.name} died and will be resurrected after 3 minutes."
    text += "\n#{attacker.name} receives :coin: **#{attacker_coin} Coin** and :fleur_de_lis: **#{attacker_honor} Honor**"
  end

  def name
    "#{attacker.name} vs #{defender.name}"
  end

  def discord_info
    url = Rails.application.routes.url_helpers.battle_url(self)
    ":crossed_swords: <@!#{attacker.discord_id}> sees <@!#{defender.discord_id}> and attacks!\n#{results_text}\nDetails: #{url}"
  end
end
