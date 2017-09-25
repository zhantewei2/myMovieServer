Array.prototype.AsyncForEach=function(eachFn,endFn){
	this.length?eachFn(this[0],()=>{this.slice(1).AsyncForEach(eachFn,endFn)}):endFn();
}
const newSize=6,
	path=require('path');
	outPath=path.resolve(__dirname,'../../static/homeCard.json');
const fs=require('fs'),
	zlib=require('zlib');
	
module.exports=function(Router,mongoose){
	let router=new Router(),
		cgList=['fictions','actions','horros','comeds','romances','dramas','wars','documentarys','home'];
	router.use(async(ctx,next)=>{
		let obj=ctx.request.body;
		if(!obj)return ctx.status=400;
		ctx.myObj=obj;
		await next();
	})
	router.post('/insert',async(ctx)=>{
		//{cg:category,b:branch,d:listData}
		let opt={},obj=ctx.myObj;
		opt[obj.cg+'.'+obj.b]=obj.d;
		ctx.body=await mongoose.listColle.update(
			{},
			{$set:opt})
	})
	
	router.post('/updateHot',async(ctx)=>{
		//{cg:category};
		let opt={},count=1;
		ctx.body=await new Promise(resolve=>{
			cgList.AsyncForEach(
				(cg,next)=>{
					let obj,opt2={name:1,date:1};
					if(cg=='home'){
						obj={};
						opt2.category=1;
					}else{
						obj={category:cg};
						}
					mongoose.movieColle.find(obj,opt2).sort({gc:-1}).limit(8).exec((err,data)=>{
						if(!data||!data[0]){
							next();
						}else{
							if(opt2.category){
								let cg,data2=[];
								data.forEach(v=>{
									let v2={}
									v2=JSON.parse(JSON.stringify(v));
									v2.cg=v2.category;
									delete v2.category;
									data2.push(v2);
								})
								data=data2
							}
							opt[cg+'.h']=data;
							next();
						}
					})
				},
				()=>{
					mongoose.listColle.update({},{$set:opt}).then(v=>{
						v?resolve(1):resolve(0);
					});
				}
			)
		})
	});
	router.get('/makeHome',async(ctx)=>{
		ctx.body=await new Promise(resolve=>{
		mongoose.mainColle.findOne({},{_id:0,user:0,pwd:0,__v:0,sources:0}).exec((err,v)=>{

			if(!v)return resolve(0);
			let arr=[],field={playData:0,itd:0,notes:0,gt:0,gc:0},store={};
			for(let i in JSON.parse(JSON.stringify(v))){
				arr.push({name:i,count:v[i]});
			}
			arr.AsyncForEach(
				(v,next)=>{
					if(v.count<=0)return next();
					let size=v.count-newSize;
					if(size<0)size=0;
					if(v.name=='total'){
						mongoose.movieColle.find({}).sort({_id:-1}).limit(newSize).then(v=>{
							if(!v||!v[0]) return next();
							store['home']=v;
							next();
						})
					}else{
						mongoose.movieColle.find({category:v.name,id:{$gt:v.count-newSize}},field).then(d=>{
							if(!d)return next();
							store[v.name]=d;
							next();
						})
					}
				},
				()=>{
					let str=JSON.stringify(store);
					/*
					fs.writeFile(outPath,str,(err)=>{
						resolve(str);
					})
					
					*/
					zlib.gzip(Buffer.from(str,'utf8'),(err,data)=>{
						fs.writeFile(outPath,data,'utf8',(err)=>{
							err?resolve(0):resolve(1);
						})
					})
						
				}
			)
		})
		})
	})
	return router;
}