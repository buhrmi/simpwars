class ChangeIntegerLimits < ActiveRecord::Migration[6.0]
  def change
    change_column :servers, :discord_id, :bigint
    change_column :users, :discord_id, :bigint
  end
end
