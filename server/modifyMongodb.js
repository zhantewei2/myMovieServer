var mongoose=require('./mongodb.js');


mongoose.movieColle.find({'_id':1},(err,v)=>{
	console.log(err,v)
})   