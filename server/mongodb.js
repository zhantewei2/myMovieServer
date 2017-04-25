
// Instance of mongoose:
var mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:3002/media' /*,{user:'loveWorld',pass:'loveEveryone'} */);

var Schema=mongoose.Schema;
var replySchema=new Schema({
	id:Number,
	ref:Schema.Types.ObjectId,
	d:{type:Date,default:Date()}, //date
	c:String, //content
	n:String //name
})
var notesSchema=new Schema({
	_id:Schema.Types.ObjectId,
	r:[replySchema], //reply     limit maxSize-2;
	rl:{type:Number,default:0}, //reply length;
	c:String, //content
	d:{type:Date,default:Date()}, //date
	n:String, //name 
})
var movieSchema=new Schema({
	_id:Number,
	id:{type:Number,index:true},
	name:{type:String,index:{unique:true}},
	date:{default:Date(),type:Date},
	lag:String,    //language
	playData:Object,
	year:Number,
	actors:String,
	nc:{default:0,type:Number}, //notesCount
	notes:[notesSchema],
	region:String,
	category:{type:String,index:true},
	visitCount:Number,
	itd:String,
	g:{type:Number,default:6},  //grade
	gc:{type:Number,default:1}, //gradeCount
	gt:{type:Number,default:6}, //gradeTotal
	img:String,
	__v:Number,
	nv:{type:Number,default:0} //notesVersion;
})
var mainSchema=new Schema({
	user:String,
	pwd:String,
	fictions:{type:Number,default:0},
	actions:{type:Number,default:0},
	horros:{type:Number,default:0},
	comeds:{type:Number,default:0},
	romances:{type:Number,default:0},
	dramas:{type:Number,default:0},
	wars:{type:Number,default:0},
	documentarys:{type:Number,default:0},
	total:{type:Number,default:0},
	sources:Array
});
//method

movieSchema.statics.saveNotes=function(movie_id,noteData){
	let	obj={c:noteData.c,
			 n:noteData.n,
			 d:Date(),
			 rl:0,
			 r:[],
			 _id:new mongoose.Types.ObjectId
			};
	return this.update({_id:movie_id},{$push:{notes:obj},$inc:{nc:1,nv:1}}).then(v=>{
		return v?1:0;
	})
}
var	mainModel=mongoose.model('mains',mainSchema);
//..............
var movieModel=mongoose.model('movies',movieSchema);

var	replyModel=mongoose.model('replys',replySchema);

var listModel=require('./model/list-model.js')(mongoose);


myMethod={
	saveReply:(movie_id,notesId,data)=>{
		return new Promise(resolve=>{
			let opt={'notes.$.r':{$each:[data],$slice:-2}};
			movieModel.findOneAndUpdate(
				{_id:movie_id,'notes._id':notesId},
				{$push:opt,$inc:{'notes.$.rl':1,nv:1}},
				{fields:{'notes.$':1,_id:0}}
			).then(v=>{
				new replyModel({
					ref:notesId,
					c:data.c,
					n:data.n,
					d:Date(),
					id:v.notes[0].rl+1
				}).save(err=>{
					if(!err){resolve(1);return;}
					movieModel.update(
						{_id:movie_id,'notes._id':notesId},
						{$inc:{'notes.$.rl':-1}}
						).then(v=>{
							resolve(0);
						})
				})
			})
			/*
			data.date=Date();
			let opt={};
			opt['notes.$.r']={$each:[data],$slice:-2};
			new replyModel({ref:notesId,c:data.c,n:data.n,d:data.date}).save(err=>{
				if(err)return resolve(0);
				movieModel.findOneAndUpdate({_id:movie_id,'notes.id':notesId},{$push:opt,$inc:{'notes.$.rl':1}}).then(v=>{
					resolve(1);
				})
			})
			*/
		})
	},
	saveMovie:(category,data)=>{
		return new Promise(resolve=>{
			let opt={total:1};
			opt[category]=1;
			mainModel.findOneAndUpdate({},{$inc:opt},{new:true,fields:opt}).then(v=>{
				data._id=v.total;
				data.id=v[category];
				new movieModel(data).save(err=>{
					if(!err){ resolve(true);return;}
					let opt2={total:-1};
					opt2[category]=-1;
					mainModel.update({},{$inc:opt2}).then(v=>{
						resolve(false);
					})
				})
			})
		})
	},
	removeMovie:(_id,id,category)=>{
		return new Promise(resolve=>{
			movieModel.remove({_id:_id}).then(v=>{
				if(!v){resolve(0);return}
					movieModel.update({category:category,id:{$gt:id}},{$inc:{id:-1}},{multi:true}).then(v=>{
						let opt={};
						opt[category]=-1;
						mainModel.update({},{$inc:opt}).then(v=>{
							v?resolve(1):resolve(0);
						})
					})

			})
		})
	}
}

exports.mainColle=mainModel;
exports.movieColle=movieModel;
exports.replyColle=replyModel;
exports.listColle=listModel;
exports.myMethod=myMethod;