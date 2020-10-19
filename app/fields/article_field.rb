require "administrate/field/base"

class ArticleField < Administrate::Field::Base
  def to_s
    data
  end
end
