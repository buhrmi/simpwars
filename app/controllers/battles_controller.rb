class BattlesController < ApplicationController
  def show
    battle = Battle.find(params[:id])
    @title_object = battle
    render inertia: 'battles/show', props: {
      battle: battle.to_prop
    }
  end
end
