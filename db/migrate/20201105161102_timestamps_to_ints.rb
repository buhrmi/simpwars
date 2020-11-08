class TimestampsToInts < ActiveRecord::Migration[6.0]
  def change
    change_column :users, :last_hp_updated_at, :integer
    add_column :users, :last_attacked_at, :integer
  end
end
