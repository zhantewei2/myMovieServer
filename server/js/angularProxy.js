const send=require('koa-send');
const fs=require('fs')
const pathUt=require('path');
const staticCache=require('koa-static-cache');
module.exports=function(app,path,dirname=''){
	app.use(async(ctx,next)=>{
		ctx.set('Content-Encoding','gzip');
		ctx.set('Cache-Control','max-age=604800')
		await next();
	})
	app.use(staticCache(
		'dist',
		{
			buffer:true
		}
	));
	app.use(async(ctx)=>{
		await send(ctx,path+'/index.html',dirname)
	})
}