# frozen_string_literal: true

# monkeypatch activestorage to enable caching of variants by a CDN not contact S3 on every request 
# see https://www.dwightwatson.com/posts/caching-variants-with-activestorage
# fixed in rails 6.1 https://github.com/rails/rails/pull/37901 
# remove this file when running on rails 6.1
module ActiveStorage
  class RepresentationsController < BaseController
    include ActiveStorage::SetBlob

    def show
      expires_in 1.year, public: true
      variant = @blob.representation(params[:variation_key]).processed
      send_data @blob.service.download(variant.key),
                type: @blob.content_type || DEFAULT_SEND_FILE_TYPE,
                disposition: 'inline'
    end
  end
end