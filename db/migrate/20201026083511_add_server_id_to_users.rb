class AddServerIdToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :server_id, :integer
    add_index :users, :server_id
  end
end
