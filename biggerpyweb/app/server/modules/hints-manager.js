var mongoUtil = require('./mongoUtil');

exports.saveHint = function(user, data, callback) {
    var hints = mongoUtil.getDb().collection('hints');
    hints.findOne({userID:user._id}, function(e, o) {
		if (o) {
            o.data = data;
            hints.save(o, {safe: true}, function(e) {
				if (e) callback(e);
				else callback(null, o);
			});
		} else {
            hints.insert({
			    userID 	: user._id.toString(),
			    data 	: data
		    }, {safe: true}, function(e) {
			    if (e) callback(e);
			    else callback(null, o);
            });
        }
	});
}

exports.loadHint = function(userID, callback) {
    mongoUtil.getDb().collection('hints').findOne({"userID":userID}, function(e, o) {
		if (o) {
            callback(null, o.data)
        } else {
            callback("Cant find entry");
        }
	});
}