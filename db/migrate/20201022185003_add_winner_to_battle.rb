class AddWinnerToBattle < ActiveRecord::Migration[6.0]
  def change
    add_column :battles, :winner_id, :integer
    add_column :battles, :winner_type, :string
  end
end
