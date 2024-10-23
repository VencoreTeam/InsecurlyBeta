const express = require('express')
const app = express();
app.get('/', (req, res) => {
  res.send(`Panda's trying to play blooket right now...<a href="https://www.youtube.com/watch?v=2JrTZ7CH258">Watch here</a>`);
});
app.listen(process.env.PORT, function() {
  console.log('Webserver started on port ' + process.env.PORT + '!');
});
