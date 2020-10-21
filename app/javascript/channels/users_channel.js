import consumer from "./consumer"
import currentUser from 'user'

consumer.subscriptions.create("UsersChannel", {
  connected() {
    console.log('Connected to UsersChannel')
    // Called when the subscription is ready for use on the server
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
  },

  received(data) {
    if (data.update) {
      currentUser.update(function(user) {
        Object.assign(user, data.update)
        return user
      })
    }
  }
});
