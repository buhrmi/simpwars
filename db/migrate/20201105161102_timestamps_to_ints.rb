class TimestampsToInts < ActiveRecord::Migration[6.0]
  def change
    change_column :users, :last_hp_updated_at, 'integer USING CAST(last_hp_updated_at AS integer)'
    add_column :users, :last_attacked_at, 'integer USING CAST(last_attacked_at AS integer)'
  end
end
