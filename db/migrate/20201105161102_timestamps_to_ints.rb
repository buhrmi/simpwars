class TimestampsToInts < ActiveRecord::Migration[6.0]
  def change
    change_column :users, :last_hp_updated_at, 'integer USING extract(epoch from last_hp_updated_at)', default: 0
    add_column :users, :last_attacked_at, :integer, default: 0
  end
end
