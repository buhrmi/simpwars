# This module is included by all attackble classes.
# It is also compiled to javascript by ruby2js and used client-side
module Attackable
  attr_accessor :remaining_hp

  def stats
    {
      con: 5
    }
  end

  def max_hp
    100 + self.stats[:con] * 10
  end

  def current_hp
    return [self.last_hp, 0].max() if self.start_regenerating_at() > servertime
    [[self.last_hp, 0].max() + (servertime - self.start_regenerating_at()) * self.hp_per_second(), self.max_hp()].min()
  end

  def hp_emoji
    if current_hp <= 0
      ":skull:"
    elsif current_hp < max_hp
      ":broken_heart:"
    else
      ":heart:"
    end
  end

  def hp_per_second
    self.max_hp / 180.0
  end

  def current_hp_percent
    100 * self.current_hp / self.max_hp
  end

  def level
    1
  end

  def resurrection_wait_time
    3 * 60
  end

  def regen_wait_time
    5
  end

  def start_regenerating_at
    if self.last_hp <= 0
      self.last_hp_updated_at + self.resurrection_wait_time
    else
      self.last_hp_updated_at + self.regen_wait_time
    end
  end

  def remaining_seconds
    [start_regenerating_at - servertime, 0].max + (max_hp - current_hp) / hp_per_second
  end

  def servertime
    Time.now
  end
end