class ApplicationController < ActionController::Base
  helper_method :current_user
  
  before_action :set_locale

  rescue_from ActiveRecord::RecordInvalid do |e|
    flash[:errors] = e.record.errors
    redirect_back fallback_location: root_url
  end

  inertia_share do
    {
      current_user: current_user.try(:to_prop, true),
      flash: flash.to_hash,
      layout: 'layout'
    }
  end

  def set_locale
    if request.headers['Accept-Language']
      locale = request.headers['Accept-Language'].split('-')[0]
    end
    cookies[:locale] = params[:locale] if params[:locale]
    locale = cookies[:locale] if cookies[:locale]
    I18n.locale = locale if ['en', 'ja'].include? locale
    # Rails.application.routes.default_url_options[:locale] = I18n.locale
  end

  def default_url_options
    # {locale: params[:locale] || I18n.locale }
    {host: ENV['DEFAULT_HOST']}
  end

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

end
