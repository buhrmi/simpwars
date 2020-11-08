window.Time = {
  get unix() {
    // TODO: use server time
    return new Date().getTime() / 1000
  }
}