const express = require("express");
const postRouter = express.Router();
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const mongourl =
    "mongodb+srv://admin:admin@cluster0.ka8dm.mongodb.net/techblog?retryWrites=true&w=majority";
let db;

MongoClient.connect(mongourl, (err, connection) => {
    if (err) throw err;
    db = connection.db("techblog");
});

postRouter.route("/").get((req, res) => {
    db.collection("posts")
        .find({isActive : true})
        .toArray((err, data) => {
            if (!req.session.user) {
                return res.redirect(
                    "/?errmessage=You are not logged in to view posts, login first"
                )
            }else{
            if (err) throw err;
            let revdata = data.reverse()
            let errmessage = req.query.errmessage ? req.query.errmessage : ""
            return res.render('post', {postdata: revdata,userdata : req.session.user, errmessage})
            }
        });
});

postRouter.route('/addpost')
    .get((req, res) => {
        if (!req.session.user) {
            return res.redirect(
                "/?errmessage=You are not logged in, login to add post"
            )
        }else{
            let errmessage = req.query.errmessage ? req.query.errmessage : ""
            return res.render('addPost', {userdata : req.session.user, errmessage})
        }
    })

postRouter.route("/adduserpost").post((req, res) => {
    if (!req.session.user) {
        return res.redirect(
            "/?errmessage=You are not logged in, login to add post"
        );
    } else {
        let data = {
            title: req.body.title,
            description: req.body.description,
            createdBy: req.session.user.name,
            createrId: req.session.user._id,
            isActive: true,
            tags: req.body.tags,
            createdDate: new Date(Date.now()).toISOString(),
            lastUpdated: new Date(Date.now()).toISOString(),
        };

        db.collection("posts").insert(data, (err, result) => {
            res.redirect("/post");
        });
    }
});

postRouter.route('/edit/:id')
    .get((req, res) => {
        if(!req.session.user){
            return res.redirect('/?errmessage=No session Found! Login First')
        }
        let Id = mongodb.ObjectID(req.params.id)
        db.collection('posts').findOne({_id:Id, isActive:true},(err, data) => {
            if (err) throw err
            return res.render('edit', {data, userdata:req.session.user})
        })
    })

postRouter.route('/editpost/:id')
    .post((req, res) => {
        if(!req.session.user){
            res.redirect('/?errmessage=No session Found! Login First')
        }
        let Id = mongodb.ObjectID(req.params.id)
        db.collection('posts').update(
            {_id : Id},
            {
                $set:{
                    title: req.body.title,
                    description : req.body.description,
                    tags: req.body.tags,
                    lastUpdated: new Date(Date.now()).toISOString()
                }
            }, (err, result) => {
                if (err) throw err
                return res.redirect('/post')
            }
        )
    })

postRouter.route('/deletePost/:id')
    .get((req, res) => {
        if(!req.session.user){
            res.redirect('/?errmessage=No session Found! Login First')
        }
        let Id = mongodb.ObjectID(req.params.id)
        db.collection('posts').remove(
            {_id : Id}, (err, result) => {
                if (err) throw err
                return res.redirect('/post')
            }
        )
    })


module.exports = postRouter;
