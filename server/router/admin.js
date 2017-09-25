const pswd=require('../hid.js').pswd;
module.exports=function(Router,mongoose){
	const router=new Router(),
		router2=new Router();
		listRouter=require('./admin/list.js')(Router,mongoose);
	router.post('/login',async(ctx)=>{
		//{p:..};
		let obj=ctx.request.body;
		if(!obj)return;
		if(obj.p==pswd){
			ctx.body=1;
			ctx.session.login=1;
		}else{ctx.body=0}
	})
	router.post('/checkLogin',async(ctx)=>{
		if(ctx.session.login){
			ctx.body=1;
		}else{
			ctx.body=0;
		}
	})
	router.post('/logout',async(ctx)=>{
		ctx.session.login=null;
		ctx.body=1;
	})
	router.use(async(ctx,next)=>{
		if(!ctx.session.login){
			ctx.status=404;}else{
				await next();		
			}
	})
	router2.use(async(ctx,next)=>{
		let obj=ctx.request.body;
		if(!ctx.session.login||!obj)ctx.status=404;
		ctx.myObj=obj;
		await next();
	})

	router2.post('/update',async(ctx)=>{
		//{ i:_id,d:d};
		let obj=ctx.myObj,
			query={$set:obj.d};
		if(!obj['__v'])query['$inc']={__v:1}
		ctx.body=await mongoose.movieColle.update({_id:obj.i},query).then(v=>{
			return v?1:0;
		}) 
	})
	router2.post('/insert',async(ctx)=>{
		ctx.body=await mongoose.myMethod.saveMovie(ctx.myObj.category,ctx.myObj).then(v=>{
			return v;
		})
	})
	router2.post('/remove',async(ctx)=>{
		//{_id,id,cg};
		ctx.body=await mongoose.myMethod.removeMovie(ctx.myObj._id,ctx.myObj.id,ctx.myObj.cg).then(v=>{
			return v;
		})
	})
	router2.post('/delNote',async(ctx)=>{
		// obj: {n:movieName,o:notesId,c:movieCategory};
		let obj=ctx.request.body;
		if(!obj)return;
		ctx.body=await mongoose.movieColle.update({category:obj.c,name:obj.n},{$pull:{notes:{_id:obj.o}},$inc:{nc:-1,nv:1}}).then(v=>{
			return v?1:0;
		})
	})
	router2.use('/list',listRouter.routes());
	router.use('',router2.routes());
	return router;
}