const Router=require('koa-router'),
	router=new Router(),
	Verify=require('./verify.js'),
	verify=new Verify(),
	key='da82';
module.exports=function(mongoose){
	/*
	router.use(async(ctx,next)=>{
		if(ctx.header.origin!='http://localhost:4200'){
			ctx.status=404;
		}else{
			await next();	
		}
	})
	*/
	router.post('/v',async(ctx)=>{
		console.log('verfiy');
		let vf=verify.genVerify();
		ctx.session.vf2=vf.toLowerCase();
		ctx.body={vf:verify.encrypt(vf,key)};
	});
	router.post('/g',async(ctx)=>{
		//{i:_id,g:grade,v:verify}
		let obj=ctx.request.body;
		if(!obj)return;
 		if(obj.v!=ctx.session.vf2)return;
 		ctx.body=await new Promise(resolve=>{
 			mongoose.movieColle.findOne(
	 			{_id:obj.i},
	 			{_id:0,gc:1,gt:1},
	 			).then(v=>{
	 			if(!v)return resolve(0);
	 			let newGrade=Math.round(((v.gt+obj.g)/++v.gc)*10)/10;
	 			mongoose.movieColle.update(
	 				{_id:obj.i},
	 				{
	 					$set:{g:newGrade},
	 					$inc:{gc:1,gt:obj.g}
	 				}).then(v=>{
	 					v?resolve({g:newGrade}):resolve(0);
	 				})
 			})
 		})
	});
	return router;
}