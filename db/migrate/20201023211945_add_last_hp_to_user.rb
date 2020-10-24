class AddLastHpToUser < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :last_hp, :integer, default: 1000
    add_column :users, :last_hp_updated_at, :timestamp, default: Time.now
  end
end
