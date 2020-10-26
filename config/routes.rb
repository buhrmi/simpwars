Rails.application.routes.draw do
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
  
  scope '(:locale)', locale: /#{I18n.available_locales.join('|')}/ do
    get '/(:slug)', to: 'slugs#show'
  end
  
  root to: 'users#new'
end
