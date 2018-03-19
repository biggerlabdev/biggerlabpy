var mongoUtil = require('./mongoUtil');

exports.loadTeachers = function(callback) {
    var users = mongoUtil.getDb().collection('accounts');
    users.find({userType: "teacher"}, {name: 1}).toArray(function(err,items){
        items.unshift({"name": "I do not have a teacher", "_id": ""});
        if(err) callback(err);
        else callback(null, items);
    });
}
