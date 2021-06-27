const fs= require('fs');
const path= require('path');
const {validationResult}= require('express-validator/check');
const User= require('../models/user');
const Post= require('../models/post');
exports.getPosts= async (req, res, next)=>{//this function now fetches all the posts
    const currentPage= req.query.page || 1;
    const perPage=2;
    let totalItems;
    try{
        totalItems= await Post.find().countDocuments()
        const posts= await Post.find()
        .populate('creator')//find method fetches entire data form the database and does not maps
        .skip((currentPage-1)*perPage)
        .limit(perPage);
        res.status(200).json({
            message: "Posts fetched successfully",
            posts: posts,
            totalItems: totalItems
        })
    }catch(err){
        if(!err.statusCode) err.statusCode=500;
        next(err);
    }
}
//this one is done async await.Refer to know more about it.
//async ->in front of the (req, res, next) and await->in front of all the function that fetches the db and takes time.
//async await are just the replacement of then catch.Both of them deal with promises.
//top level await->A new modification where we can use await out of async.
//mongoose returns a promise like object but not a promise.
exports.createPost=(req, res, next)=>{
    const errors= validationResult(req);
    if(!errors.isEmpty()){
        const error= new Error('Validation failed, entered data is incorrect');
        error.statusCode= 422;
        throw error;
    }
    if(!req.file){//image is not available.
        const error= new Error('No image provided');
        error.statusCode= 422;
        throw error;
    }
    const imageUrl= req.file.path;
    //create post in db.
    const title= req.body.title;
    const content= req.body.content;
    let creator;
    const post= new Post({//This is a constructor.
        title: title,
        content: content, //this title and content field are populated by the data provided by fetch request.
        imageUrl: imageUrl,
        creator: req.userId//userId is assigned to req once it checked for authentication by the is-auth
    })
    post.save()
    .then(result=>{
        return User.findById(req.userId);
    })
    .then(user=>{
        creator=user;
        user.posts.push(post);
        return user.save();
    })
    .then((result)=>{
        res.status(201).json({
            message: 'Post created successfully.',
            post: post,//this is the output of new Post({}) constructor which we get as a back result.
            creator: {_id: creator._id, name: creator.name} //just an extra information
        })
    })
    .catch(err=>{//error from this place is because of post not getting saved properly.
        if(!err.statusCode) err.statusCode= 500;
        next(err);
    });
}
exports.getPost= (req, res, next)=>{
    const postId= req.params.postId;
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error= new Error('Could find the post.');
            error.statusCode= 404;
            throw error;
        }
        res.status(200).json({
            message: 'Post fetched',
            post: post
        })
    })
    .catch(err=>{
        if(!err.statusCode) err.statusCode= 500;
        next(err);
    })
}
exports.updatePost=(req, res, next)=>{
    const error= validationResult(req);
    if(!error.isEmpty()){
        const error= new Error('No image available');
        error.statusCode=422;
        throw(error);
    }
    const postId= req.params.postId;
    const title= req.body.title;
    const content= req.body.content;
    let imageUrl= req.body.image;
    if(req.file){
        imageUrl= req.file.path;
    }
    if(!imageUrl){
        const error= new Error('No image available');
        error.statusCode=422;
        throw(error);
    }
    Post.findById(postId)
    .then(post =>{
        if(!post){
            const error= new Error('Could not find the post.');
            error.statusCode= 404;
            throw error;
        } 
        //only if the present post was added by the current user it can be deleted.For that the creator id stored in each of the post must match the userId of the user who is requesting.
        if(post.creator.toString()!==req.userId){
            const error= new Error('Not authorized');
            error.statusCode=403;//authorization issues have status page==403.
            throw error;
        }
        if(imageUrl!==post.imageUrl) clearImage(post.imageUrl);//This means that the new image url is different from the old one and hence there is no need of post.imageUrl
        post.title= title;
        post.content= content;
        post.imageUrl= imageUrl;
        return post.save();//this return is necessary as we don't want to run the function any more and hence use another then element.
    })
    .then(result=>{
        res.status(200).json({
            message: 'Post Updated',
            post: result
        })
    })
    .catch(err=>{
        if(!err.statusCode) err.statusCode=500;
        next(err);
    })
}
exports.deletePost= (req, res, next)=>{
    const postId= req.params.postId;
    Post.findById(postId)
    .then(post =>{
        if(!post){
            const error= new Error('Could not find the post.');
            error.statusCode= 404;
            throw error;
        }
        if(post.creator.toString()!==req.userId){
            const error= new Error('Not authorized');
            error.statusCode=403;
            throw error;
        }
        clearImage(post.imageUrl);//This means that the new image url is different from the old one and hence there is no need of post.imageUrl
        return Post.findByIdAndRemove(postId);//this return is necessary as we don't want to run the function any more and hence use another then element.
    })
    .then(result=>{
        return User.findById(req.userId);
    })
    .then(user=>{
        user.posts.pull(postId);
        return user.save();
    })
    .then(result=>{
        res.status(200).json({
            message: 'Post Deleted',
        })
    })
    .catch(err=>{
        if(!err.statusCode) err.statusCode=500;
        next(err);
    })
}






//whenever an update is done we clear the image if required.
const clearImage= filePath=>{
    filePath= path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err=>console.log(err));
}