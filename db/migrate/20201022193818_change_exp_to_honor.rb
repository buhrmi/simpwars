class ChangeExpToHonor < ActiveRecord::Migration[6.0]
  def change
    rename_column :users, :exp, :honor
    rename_column :users, :gold, :coin
  end
end
