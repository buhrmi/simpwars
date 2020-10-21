import consumer from "./consumer"

consumer.subscriptions.create("UsersChannel", {
  connected() {
    console.log('Connected to UsersChannel')
    // Called when the subscription is ready for use on the server
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
  },

  received(data) {
    // Called when there's incoming data on the websocket for this channel
  }
});
