class CreateServers < ActiveRecord::Migration[6.0]
  def change
    create_table :servers do |t|
      t.integer :discord_id
      t.string :name
      t.integer :admin_user_id
      t.timestamps
    end
  end
end
