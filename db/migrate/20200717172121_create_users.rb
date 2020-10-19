class CreateUsers < ActiveRecord::Migration[6.0]
  def change
    create_table :users do |t|
      t.string :name
      t.string :nickname
      t.string :email
      t.string :description
      t.string :twitter_id
      t.string :twitch_id
      t.string :discord_id
      t.timestamps
    end
  end
end
