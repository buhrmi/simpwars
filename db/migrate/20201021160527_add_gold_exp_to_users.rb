class AddGoldExpToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :gold, :integer, default: 0
    add_column :users, :exp, :integer, default: 0
  end
end
