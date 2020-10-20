class ChangeIntegerLimits < ActiveRecord::Migration[6.0]
  def change
    change_column :servers, :discord_id, :integer, limit: 8
    change_column :users, :discord_id, :integer, limit: 8
  end
end
