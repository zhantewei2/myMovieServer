module.exports=function(Router,mongoose){
	const router=new Router();
	const pageSize=12;

	router.get('/searchMovie',async(ctx)=>{
		//{cg?:category,n:name,s?:start,l?:limit}
		//return {d:data,c:count};
		//        {d:data};
		let obj=ctx.query;
		if(!obj)return;
		let n=decodeURIComponent(obj.n),cg=obj.cg,err;
		try{
			n=n.slice(0);
			if(cg){
				cg=cg.slice(0);
				if(cg.length>15)err=true;
			}
			if(n.length>10)err=true;
		}catch(e){
			err=true;
		}
		if(!err){
			ctx.set('Cache-Control','max-age=3600');

			let query={name:new RegExp(obj.n)},opt={playData:0,itd:0,notes:0,gt:0,gc:0};
			if(cg)query.category=cg;
			if(!obj.s&&!obj.l){

				ctx.body=await mongoose.movieColle.count(query).then(count=>{
					let limit=count>pageSize?pageSize:count;
					let skip=count-limit;
					return mongoose.movieColle.find(query,opt).skip(skip).limit(limit).then(arr=>{
						return arr?{d:arr,c:count}:0;
					})
				})
			}else{
				ctx.body=await mongoose.movieColle.find(query,opt).skip(+obj.s).limit(+obj.l).then(d=>{
					return d?{d:d}:0;
				})
			}
			
		}else{
			ctx.body=0;
		}
	});
	router.get('/homeList',async(ctx)=>{
		ctx.body=await mongoose.listColle.myMethod.findList('home').then(v=>v?v:0);
	});
	router.get('/list',async(ctx)=>{
		let cg=ctx.query.cg;
		if(!cg)return;
		ctx.body=await mongoose.listColle.myMethod.findList(cg).then(v=>v?v:0);
	})



	return router;
}