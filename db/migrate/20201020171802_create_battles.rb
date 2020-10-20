class CreateBattles < ActiveRecord::Migration[6.0]
  def change
    create_table :battles do |t|
      t.bigint :server_id

      t.integer :attacker_id
      t.string :attacker_type
      t.integer :defender_id
      t.string :defender_type   
      
      t.json :results

      t.timestamps
    end
  end
end
