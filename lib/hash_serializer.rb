class HashSerializer
  def self.dump(obj)
    obj
  end

  def self.load(hash)
    (hash || {}).with_indifferent_access
  end
end