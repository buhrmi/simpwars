class AddPlayersCountToServers < ActiveRecord::Migration[6.0]
  def change
    add_column :servers, :players_count, :integer
    add_index :servers, :players_count
  end
end
