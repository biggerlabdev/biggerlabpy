
var mongoUtil = require('./mongoUtil');

exports.addNewTemplate = function(lesson, title, content, contentFinal, callback) {
    var templates = mongoUtil.getDb().collection('templates');
    templates.insert({
        lesson 	: lesson,
        title 	: title,
        content : content,
        contentFinal: contentFinal
    }, {safe: true}, function(e) {
        if (e) callback(e);
        else callback(null);
    });
}

exports.loadTemplateList = function(callback) {
    var templates = mongoUtil.getDb().collection('templates');
    templates.find({}, {lesson: 1, title: 1}).sort( { lesson: 1 } ).toArray(function(err,items){
        if(err) callback(err);
        else callback(null, items);
    });
}

exports.loadTemplate = function(id, teacher, callback) {
    var templates = mongoUtil.getDb().collection('templates');
    templates.findOne({_id:getObjectId(id)}, (teacher === "true") ? {contentFinal: 1} : {content: 1}, function(e, o) {
        if (o) {
            if (teacher === "true") {
                callback(null, o.contentFinal);
            } else {
                callback(null, o.content);
            }
        } else {
            callback(e);
        }
    });
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}
