class CreatePlayers < ActiveRecord::Migration[6.0]
  def change
    create_table :players do |t|
      t.string :name
      t.integer :server_id
      t.integer :user_id
      t.integer :coin, default: 0
      t.integer :exp, default: 0
      t.integer :last_hp, default: 100
      t.integer :last_hp_updated_at, default: 0
      t.integer :last_attacked_at, default: 0

      t.timestamps
    end

    add_index :players, :name
    add_index :players, :server_id
    add_index :players, :user_id
    add_index :players, :exp
    remove_column :users, :nickname
    remove_column :users, :coin
    remove_column :users, :honor
    remove_column :users, :last_hp
    remove_column :users, :last_hp_updated_at
    remove_column :users, :last_attacked_at
    
  end
end
