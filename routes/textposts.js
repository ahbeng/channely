var TextPost = require('../models/textpost').TextPost,
    Channel = require('../models/channel').Channel,
    User = require('../models/user').User,
    passport = require('passport');

exports.index = function (req, res) {
  TextPost.find({ _channel: req.params.id }, null, {sort: {time: 1}},
    function(err, textPosts) {
      err ? res.send(500, err) : res.json(textPosts);
    });
}

exports.create = function (req, res) {
  Channel.findById(req.params.id, function (err, channel) {
    if (err) { res.send(500, err); }
    else if (!channel) { res.send(404, "No such channel exists!");}
    else {
      var userProperties = {
        content: req.body.content,
    _channel: channel._id };

      var token = undefined;

      if (req.headers && req.headers['authorization']) {
        var parts = req.headers['authorization'].split(' ');
        if (parts.length == 2) {
          var scheme = parts[0]
            , credentials = parts[1];

          if (/Bearer/i.test(scheme)) {
            token = credentials;
          }
        }
      }

      if (req.body && req.body['access_token']) {
        token = req.body['access_token'];
      }

      if (req.query && req.query['access_token']) {
        token = req.query['access_token'];
      }

      // if access token exists, save user
      // else just save the username
      if (token) {
        User.findOne({ accessToken: token }, function (err, user) {
          if (err || !user) { userProperties.username = req.body.username; }
          else if (user) {
            userProperties.owner = user._id;
            userProperties.username = user.username;
          }

        var textPost = new TextPost(userProperties);
        textPost.save(function (err) {
          err ? res.send(422, err) : res.send(201, textPost);
        });

        });
      } else {
        if (req.body.username)
          userProperties.username = req.body.username;

        var textPost = new TextPost(userProperties);
        textPost.save(function (err) {
          err ? res.send(422, err) : res.send(201, textPost);
        });

      }
    }
  });
};

exports.delete = [
  passport.authenticate('bearer', {session: false}),
  function (req, res) {
    TextPost.findById(req.params.id, function (err, textPost) {
      if (!textPost) res.send(404);
      else if (textPost.owner != req.user._id) { res.send(403); }
      else {
        textPost.remove(function () {
          res.send(204);
        });
      }
    });
  }
];
