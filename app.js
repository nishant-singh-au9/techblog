const express = require("express");
let app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const mongourl =
    "mongodb+srv://admin:admin@cluster0.ka8dm.mongodb.net/techblog?retryWrites=true&w=majority";
const session = require("express-session");
const bcrypt = require("bcryptjs");
const port = process.env.PORT || 9001;
let db;
const postRouter = require('./src/routes/postRoutes')

app.use(cors()); //handling cross origin resource sharing error
app.use(express.json());
app.use(express.urlencoded());
app.use(
    session({
        secret: "youCanGiveAnyValueHere",
    })
);

MongoClient.connect(mongourl, (err, connection) => {
    if (err) throw err;
    db = connection.db("techblog");
});

//static path
app.use(express.static(__dirname+'/public'))

//html
app.set('views', './src/views')

//setting html
app.set('view engine', 'ejs')

//post route
app.use('/post', postRouter)


//health check
app.get("/health", (req, res) => {
    res.status(200).send("Health OK");
});


//default route aka login route
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/post')
    }else{
    let succmessage = req.query.succmessage ? req.query.succmessage : ""
    let errmessage = req.query.errmessage ? req.query.errmessage : ""
    res.render('login', {succmessage, errmessage})
    }
})

//route for register from ui
app.get('/register', (req, res) => {
    let errmessage = req.query.errmessage ? req.query.errmessage : ""
    res.render('register', {errmessage})
})


//route for login
app.post('/userlogin', (req, res) => {
    let user = {
        email : req.body.email
    }
    db.collection('users').findOne(user, (err, data) => {
        if(err || !data){
            return res.redirect("/?errmessage=Email Not Registered")
        }

        if(bcrypt.compareSync(req.body.password, data.password)){
            req.session.user = data
            return res.redirect("/post")
        }else{
            return res.redirect("/?errmessage=Incorrect Password")
        }
        
    })
})

//route to logout the user
app.get('/logoutuser', (req, res) => {
    req.session.user = null
    return res.redirect('/?succmessage=Logout Successfull')
})


//route to check all users
app.get('/allusers', (req, res) => {
    if (!req.session.user){
        return res.redirect('/?errmessage=No session found, login to see all the users info')
    }
    if (req.session.user.role !== 'Admin'){
        return res.redirect('/post/?errmessage=Only admins can see the users details')
    }
    db.collection('users').find().toArray((err, data) => {
        if (err) throw err 
        return res.render('users', {data, userdata: req.session.user})
    })
})

//route to register user
app.post("/registeruser", (req, res) => {
    let hash = bcrypt.hashSync(req.body.password)
    let user = {
        name : req.body.name,
        phone : req.body.phone,
        email : req.body.email, 
        password : hash,
        role : req.body.role ? req.body.role : 'User',
        isActive : true
    }
    let alres = {
        email : req.body.email
    }
    db.collection('users').findOne(alres, (err, data) => {
        if (err || data){
            return res.redirect('/register/?errmessage=email already taken')
        }else{
            db.collection('users').insert(user, (err, data) => {
                if (err) throw err
                return res.redirect('/?succmessage=You are registered, try to login')
            })
        }
    })
});

//usersbyid
app.get('/userbyid',(req,res) => {
    if(!req.session.user){
        return res.redirect('/?errmessage=No Session Found! Please Login Again')
    }
    if(req.session.user.role !=="Admin" && req.session.user){
        return res.redirect('/post?errmessage=You are Not Admin')
    }
    if(req.query.id){
        db.collection('users').findOne({_id : mongodb.ObjectID(req.query.id)},(err,data)=>{
        return res.send(data)
    })
}
});

//editUser
app.put('/edituser',(req,res) => {
    console.log(req.body)
    let status;
    if(req.body.isActive){
        if(req.body.isActive=='true'){
            status=true
        }else{
            status=false
        }
    }else{
        status=false
    }

    db.collection('users').update(
        {_id:mongodb.ObjectID(req.body._id)},
        {
            $set:{
                name:req.body.name,
                email:req.body.email,
                role:req.body.role?req.body.role:'user',
                isActive:status
            }
        },(err,result) =>{
            if(err) throw err;
            res.send('Data Updates')
        }
    )
});

app.get('/deleteUser/:id',(req,res) => {
    db.collection('users').remove({_id:mongodb.ObjectID(req.query.id)},(err,result) => {
        if(err) throw err;
        console.log(mongodb.ObjectID(req.query.id))
        res.redirect("/allusers")
    })
});


app.listen(port, (err) => {
    if (err) throw err;
    console.log(`server is ruuning on port ${port}`);
});
