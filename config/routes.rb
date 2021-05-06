Rails.application.routes.draw do
  resources :players
  # namespace :admin do
  #   resources :users
  #   resources :pages
    
  #   root to: "users#index"
  # end
  
  resources :battles
  resources :servers
  resources :users
  resources :items
  resource :session
  
  resources :discord_interactions

  get '/inventory', to: 'items#index'
  
  get '/auth/:provider/callback', to: 'sessions#create'
    
  root to: 'users#new'
end
