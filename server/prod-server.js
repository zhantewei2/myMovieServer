module.exports=function(){
var koa=require('koa'),
	Router=require('koa-router'),
	mount=require('koa-mount'),
	send=require('koa-send'),
	convert=require('koa-convert'),
	path=require('path'),
	session=require('koa-session'),
	bodyParser=require('koa-bodyparser'),
	serve=require('koa-static'),
	staticCache=require('./koa-static-cache'),
	angularProxy=require('./js/angularProxy.js'),
	fs=require('fs');
var app=new koa();
var mongoose=require('./mongodb.js');
app.keys=['movieKey'];
app.use(bodyParser());

var rootRouter=require('./router/root.js')(Router,mongoose);
var inputRouter=require('./input/input.js')(mongoose);
var adminRouter=require('./router/admin.js')(Router,mongoose);
app.use(async(ctx,next)=>{
	/*
	ctx.response.set('Access-Control-Allow-Origin','http://localhost:4200');
	ctx.response.set('Access-Control-Allow-Methods','POST,DELETE,PUT');
	ctx.response.set('Access-Control-Allow-Headers','Content-Type');
	ctx.response.set('Access-Control-Allow-Credentials','true');
	//ctx.cookies.set('XSRF-TOKEN','myKey',{httpOnly:false});
	*/
	if(ctx.method=='OPTIONS')return ctx.body='1';
	await next();
})

app.use(mount('/router',
	convert(session({
		key:'ztwKo',
		maxAge:20000
	},app))));
app.use(mount('/router',rootRouter.routes()));
app.use(mount('/input',
	convert(session({
		key:'inbz1',
		maxAge:86400000
	},app))
	))
app.use(mount('/input',inputRouter.routes()));
app.use(mount('/admin6',
	convert(session({key:'6ad6'},app))
	))
app.use(mount('/admin6',adminRouter.routes()));
let staticPath=path.join(__dirname,'static');

/*
app.use(mount('/static',async(ctx,next)=>{
	ctx.set('Content-Encoding','gzip');
	ctx.set('Cache-Control','max-age=5000');
	let noexist=await new Promise(resolve=>{
			fs.stat(path.join(staticPath,ctx.path),(err,data)=>{
			if(err)return resolve(false);
			if(new Date(data.mtime).toGMTString()==ctx.get('If-Modified-Since')){
				ctx.status=304;
				resolve(false);
			}else{
				resolve(true);
				}
			})
		})
	//ctx.set('Content-Type','text/html;charset=utf-8');
	if(noexist)await send(ctx,ctx.path,{root:staticPath});
}));
*/
app.use(mount('/static',async(ctx,next)=>{
	ctx.set('Content-Encoding','gzip');
	ctx.set('Cache-Control','max-age=5600');
	await next();
}))
app.use(mount('/static',
	staticCache(
		'static',
		{
			buffer:true
		})
))
app.use(mount('/img',async(ctx,next)=>{
	await next();
}));
app.use(mount('/img',
	staticCache(
		'public-img',
		{}
	)
))
angularProxy(app,'dist',__dirname);
app.listen(80);

}