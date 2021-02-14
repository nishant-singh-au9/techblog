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
let col_name = "users";
const postRouter = require('./src/routes/postRoutes')

app.use(cors()); //handling cross origin resource sharing error
app.use(express.json());
app.use(express.urlencoded());
app.use(
    session({
        secret: "youCanGiveAnyValueHere",
    })
);

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
        return res.status(404).send('No session found, try logging to see all the user info')
    }
    if (req.session.user.role !== 'Admin'){
        return res.status(203).send('you are not an admin')
    }
    db.collection('users').find().toArray((err, data) => {
        if (err) throw err 
        return res.status(200).send(data)
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

MongoClient.connect(mongourl, (err, connection) => {
    if (err) throw err;
    db = connection.db("techblog");
});

app.listen(port, (err) => {
    if (err) throw err;
    console.log(`server is ruuning on port ${port}`);
});
