'use strict';
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost/CoursesDB';
var request = require('request');

exports.list_all_courses = async function(req, res) {
    var minCredits = req.query.minCredits?parseInt(req.query.minCredits):100,
        minStars = req.query.minStars?parseInt(req.query.minStars):5,
        minCost = req.query.minCost?parseInt(req.query.minCost):900;
    try {
        MongoClient.connect(url, async function(err, db) {
            var data = await db.collection('LoadData').findOne();
            if(!data){
                await db.collection('Courses').remove({});
                db.collection('LoadData').insert({Data : true});
                request('https://www.techtransit.com/mission.courses/coursesData.js', async function (error, response, body) {
                    if (error) throw error;
                    if (!error && response.statusCode == 200) {
                        var importCourses = JSON.parse(body.replace("window._courses =", ''));
                        await db.collection('Courses').insert(importCourses, function (err, docs) {
                            if (err) throw error;

                            var data = docs.ops.filter(function(item){
                                return item.price <= minCost && item.rating <= minStars && item.maximumCredits <= minCredits;
                            });
                            res.send(data);
                            db.close();
                        });
                    }
                });
            }else{
                db.collection('Courses').find({"price":{$lt:minCost},"rating":{$lt:minStars},"maximumCredits":{$lt:minCredits}}).toArray(function(error, documents) {
                    if (err) throw error;
                    res.send(documents);

                    db.close();
                });
            }
        });
    }
    catch(error) {
        res.json(error);
    }
};