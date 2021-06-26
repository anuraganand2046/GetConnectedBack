const express= require('express');
const bodyParser= require('body-parser');
const path= require('path');
const mongoose= require('mongoose');
const dotenv= require('dotenv');
const multer= require('multer');
const compression= require('compression');
const authRoutes= require('./routes/auth');
const cors= require('cors');
const feedRoutes= require('./routes/feed');
const app= express();
const MONGODB_URI= `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.cfmoi.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const PORT=process.env.PORT||8080;
// app.use(bodyParser.urlencoded({extended: false}));//This just helps to convert the incoming request into a form that is readable by nodejs and it only makes x-www-form-urlencoded readable.
//here we are dealing with json data and hence no form filing is done.
const fileStorage= multer.diskStorage({//finds a destination for the image
    destination: (req, file, cb)=>{
        cb(null, 'images');
    },
    filename: (req, file, cb)=>{
        cb(null, new Date().toISOString()+'-'+file.originalname);
    }
});
const fileFilter=(req, file, cb)=>{//Checks for the validity of the image.
    if(file.mimetype=='image/png'||file.mimetype=='image/jpg'||file.mimetype=='image/jpeg') cb(null, true);
    else cb(null, false);
}
app.use(compression()); 
app.use(bodyParser.json());//application/json
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));//single means we suggest to get a single file in the field named image.

app.use(cors());
//path.join is required to attach a code in front of 'images' such that it is globally accessible.
//if any request demands the /images link this middleware is activated.
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    //Authorization is related to validating the token.
    //These three code lines help to set the header so that the client and the server side have a common header and hence there is no problem.
    //Remember that these three lines help to set headers and remove CORS(Cross origin resource sharing) errors.
    //CORS error happens when using API that does not et CORS headers.
    next();
})
app.use('/feed', feedRoutes);//This feed function may throw an error.So it is important that these error are received by proper functions.So the error handling function is written ust afterwards.
app.use('/auth', authRoutes);
//websocket requests don't interfere with http request.Both carry on hand in hand.
//websocket are based on http.
app.use((error, req, res, next)=>{
    const status= error.statusCode||500;
    const message= error.message;
    console.log(message);
    const data= error.data;//not necessary.It just helps to know the original errors.
    res.status(status).json({
        message: message,
        data: data
    })
})
mongoose.connect(MONGODB_URI)
.then(result=>{
    const server= app.listen(PORT);//server->node server
    //here server is http request.
    //require('socket.io') returns a function that will take the server as input to link the server and client.->websocket uses http protocol as a basis.
    // const io= require('socket.io')(server);
    // //below socket is the connection between the server and the client.
    // io.on("connect_error", (err) => {
    //     console.log(`connect_error due to ${err.message}`);
    // });
})
.catch(err=>console.log(err))



//socket.io if used correctly will help to update the feed of the user even when there is no demand of feed update.Otherwise we have to refresh the page in order to get new posts/changes.
