var Channel = require('../models/channel').Channel,
    User = require('../models/user').User,
    Event = require('../models/event').Event,
  TextPost = require('../models/textpost').TextPost,
    passport = require('passport');

// Channel routes

exports.index = function (req, res) {
    Channel
      .find()
      .populate('owner', '_id username')
      .exec(function (err, channels) {
        err ? res.send(500, err) : res.json(channels);
      });
};

exports.listChannelsForOwner = function (req, res) {
  Channel
    .find({ owner: req.params.id })
    .populate('owner', '_id username')
    .exec(function (err, channels) {
      err ? res.send(500, err) : res.json(channels);
    });
};

exports.show = function (req, res) {
    Channel
      .findById(req.params.id)
      .populate('owner', '_id username')
      .exec(function (err, channel) {
        !channel ? res.send(404) : res.json(channel);
      });
};

// Channel create, params:
// name:
exports.create = [
  passport.authenticate('bearer', {session: false}),
  function (req, res) {
    var channel = new Channel({
      name: req.body.name,
      createdAt: req.body.createdAt,
      owner: req.user._id,
      hashTag: req.body.hashTag
    });
    channel.save(function (err) {
      if (err) return res.send(422, err);

      var textPost = new TextPost({
        _channel: channel._id,
        content: channel.name + ' channel was created',
        username: 'Channely'
      });

      textPost.save(function (err) {
        if (err) return res.send(422, err);

        User.populate(channel, {
          path: 'owner',
          select: '_id username'
        }, function (err, channel) {
          err ? res.send(422, err) : res.send(201, channel);
        });
      });
    });
  }
];

exports.update = [
passport.authenticate('bearer', {session: false}),
  function (req, res) {
    Channel.findById(req.params.id, function (err, channel) {
      if (!channel) {
        res.send(404);
      } else if (channel.owner != req.user._id) {
        res.send(403); // authorizaton not granted
      } else {
        channel.name = req.body.name;
        channel.hashTag = req.body.hashTag;
        channel.save(function (err) {
          if (err) return res.send(422, err);

          User.populate(channel, {
            path: 'owner',
            select: '_id username'
          }, function (err, channel) {
            err ? res.send(422, err) : res.send(channel);
          });
        });
      }
    });
  }
];

exports.delete = [
passport.authenticate('bearer', {session: false}),
  function (req, res) {
    Channel.findById(req.params.id, function (err, channel) {
      if (!channel) res.send(404, "No such channel exists");
      else if (err) res.send(500, err);
      else if (channel.owner != req.user._id) {
        res.send(403);
      } else {
        Event.remove({ _channel: channel._id }, function (err) {
          if (err) return res.send(500, err);

          channel.remove(function (err) {
            if (err) return res.send(500, err);

            res.send(204);
          });
        });
      }
    });
  }
];

exports.search = function (req, res) {
  var query = {};
  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: 'i' };
  }
  Channel
    .find(query)
    .populate('owner', '_id username')
    .lean()
    .exec(function (err, channels) {
        err ? res.send(500, err) : res.json(channels);
    });
};
