
var mongoUtil = require('./mongoUtil');


exports.save = function(user, entry, data, callback) {
	var saves = mongoUtil.getDb().collection('saves');
	saves.findOne({userID:getObjectId(user._id), entry: entry}, function(e, o) {
		if (o) {
            o.data = data;
            saves.save(o, {safe: true}, function(e) {
				if (e) callback(e);
				else callback(null, o);
			});
		} else {
            saves.insert({
			    userID 	: getObjectId(user._id),
			    entry 	: entry,
			    data 	: data
		    }, {safe: true}, function(e) {
			    if (e) callback(e);
			    else callback(null, o);
            });
        }
	});
}

exports.load = function(user, entry, callback) {
    mongoUtil.getDb().collection('saves').findOne({userID:getObjectId(user._id), entry: entry}, function(e, o) {
		if (o) {
            callback(null, o.data)
        } else {
            callback("Cant find entry");
        }
	});
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}
