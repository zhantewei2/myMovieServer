const Router=require('koa-router'),
	router=new Router();
module.exports=function(mongoose){
	router.use(async(ctx,next)=>{
		if(ctx.host!='localhost:3001'){
			ctx.status=404;
		}else{
			await next();	
		}
	})
	router.get('/aa',async(ctx)=>{
		ctx.set('content-type','text/html')
		let body='<html>';
		ctx.body=body+'</html>';
	})
	return router;
}
