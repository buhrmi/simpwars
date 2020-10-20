Rails.application.routes.draw do
  resources :battles
  resources :servers
  namespace :admin do
    resources :users
    resources :pages

    root to: "users#index"
  end

  resource :session
  resources :users

  # Guilds are called "servers" in the discord UI
  resources :discord_servers
  
  resources :discord_interactions

  scope '(:locale)', locale: /#{I18n.available_locales.join('|')}/ do
    get '/(:slug)', to: 'slugs#show'
  end

  
  get '/auth/:provider/callback', to: 'sessions#create'
  
  root to: 'users#new'
end
