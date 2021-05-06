# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_11_08_131525) do

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.integer "record_id", null: false
    t.integer "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "battles", force: :cascade do |t|
    t.bigint "server_id"
    t.integer "attacker_id"
    t.string "attacker_type"
    t.integer "defender_id"
    t.string "defender_type"
    t.json "results"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "winner_id"
    t.string "winner_type"
  end

  create_table "players", force: :cascade do |t|
    t.string "name"
    t.integer "server_id"
    t.integer "user_id"
    t.integer "coin", default: 0
    t.integer "exp", default: 0
    t.integer "last_hp", default: 100
    t.integer "last_hp_updated_at", default: 0
    t.integer "last_attacked_at", default: 0
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["exp"], name: "index_players_on_exp"
    t.index ["name"], name: "index_players_on_name"
    t.index ["server_id"], name: "index_players_on_server_id"
    t.index ["user_id"], name: "index_players_on_user_id"
  end

  create_table "servers", force: :cascade do |t|
    t.bigint "discord_id"
    t.string "name"
    t.integer "admin_user_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "players_count"
    t.index ["players_count"], name: "index_servers_on_players_count"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "description"
    t.string "twitter_id"
    t.string "twitch_id"
    t.integer "discord_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "server_id"
    t.index ["server_id"], name: "index_users_on_server_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
end
