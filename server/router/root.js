const zlib=require('zlib');
const Verify=require('./verify.js');
const verify=new Verify();
const key='zz00',
	notesLimit=10;
const useCache=(ctx,time=3600)=>{
	ctx.set('Cache-Control','max-age='+time);
}
module.exports=function(Router,mongoose){
	const router=new Router();
		  inputRouter=require('./client.js')(mongoose);
		  listRouter=require('./root/list.js')(Router,mongoose);
	router.use('/input',inputRouter.routes());
	router.use('/list',listRouter.routes());
	router.post('/home',async(ctx)=>{
		ctx.body=await mongoose.mainColle.findOne({},{_id:0,user:0,pwd:0,__v:0}).then(v=>{
			return v?v:0;
		})
	})
	router.get('/movieArr',async(ctx)=>{
		//obj = { s:start,e:end,c:category,l?:list};  l:1;get listRecommand
		//return { d: data};
		let obj=ctx.request.query;
		if(!obj)return;
		//有评论时，不能缓存useCache(ctx);
		let query=obj.c=='home'?{_id:{$gt:+obj.s,$lte:+obj.e}}:{category:obj.c,id:{$gt:+obj.s,$lte:+obj.e}};
		ctx.body=await mongoose.movieColle
			.find(query,{playData:0,itd:0,notes:0,gt:0,gc:0})
			.then(v=>{
			if(!obj.l)return v?{d:v}:0;
			return mongoose.listColle.myMethod.findList(obj.c).then(list=>{
				return {d:v,l:list};
			});
		})
	})
	router.get('/movie',async(ctx)=>{
		//obj= { model: 0 ||1 ,_id: } /0:'total' 1/ : 'part' 2/:'justNotes'  //skip:10;
		let obj=ctx.query;	
		if(!obj)return;
		if(+obj.model==2){
			ctx.body=await mongoose.movieColle.findOne({_id:obj._id},{notes:{$slice:-10},_id:1}).then(v=>{
				return v?v:0;
			})
		}else{
			let opt={notes:{$slice:-10}};
			if(+obj.model){
				opt.playData=1;
				opt.itd=1;
			}
			ctx.body=await mongoose.movieColle.findOne({_id:obj._id},opt).then(v=>{
				let etag=v.__v+'_'+v.nv;
				if(etag==ctx.get('If-None-Match'))return ctx.status=304;
				ctx.set('Etag',etag);
				return v?v:0;
			})
		}
	})
	router.post('/verify',async(ctx)=>{
		let vf=verify.genVerify();
		ctx.session.vf=vf.toLowerCase();
		ctx.body={vf:verify.encrypt(vf,key)};
	})
	router.post('/notes',async(ctx)=>{
		//obj={i:_id,sk:skip,l:limit}   
		let obj=ctx.request.body;
		if(!obj)return;
		//useCache(ctx);
		ctx.body=await mongoose.movieColle.findOne({_id:obj.i},{'_id':1,notes:{$slice:[obj.sk,obj.l]}}).then(v=>{
			return v?v:0;
		})
	})
	router.post('/putNote',async(ctx)=>{
		//notes : Array<obj>   ; obj :  {i:_id,d:data ,vf:verify};
		//  data: { n:name ,c:content}
		let obj=ctx.request.body;
 		if(!obj)return;
 		if(obj.vf!=ctx.session.vf)return;
 		ctx.body=await mongoose.movieColle.saveNotes(obj.i,obj.d);
	})
	router.post('/putReply',async(ctx)=>{
		// obj :  { i:_id,o:notesId,d:replyData,vf:verfiy};
		//   data: { n : name,c: content}
		let obj=ctx.request.body;
		if(!obj)return;
		if(obj.vf!=ctx.session.vf)return;
		ctx.body=await mongoose.myMethod.saveReply(obj.i,obj.o,obj.d);
	});
	router.post('/getReply',async(ctx)=>{
		//obj : {o:refObjectId,sk:start,e:end}  default limit=10;
		let obj=ctx.request.body;
		if(!obj)return;
		ctx.body=await mongoose.replyColle.find(
			{	ref:obj.o,
				id:{$gt:obj.sk,$lte:obj.e}
			},{_id:0,ref:0,id:0}).then(v=>{
			return v?v:0;
		})
	})
	
	return router;
}