const args=process.argv.slice(2);
PROD_ENV=args[0]=='prod';
const koa=require('koa'),
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
	fs=require('fs'),
	mongoose=require('./mongodb.js');
	hidMsn=require('./hid.js');
	console.log(PROD_ENV)
mongoose.init().then(()=>{
	var app=new koa();
	app.keys=['movieKey'];
	app.use(bodyParser());
	var rootRouter=require('./router/root.js')(Router,mongoose);
	var inputRouter=require('./input/input.js')(mongoose);
	var adminRouter=require('./router/admin.js')(Router,mongoose);
	if(!PROD_ENV){
		app.use(async(ctx,next)=>{
			ctx.response.set('Access-Control-Allow-Origin','http://localhost:4200');
			ctx.response.set('Access-Control-Allow-Methods','POST,DELETE,PUT');
			ctx.response.set('Access-Control-Allow-Headers','Content-Type');
			ctx.response.set('Access-Control-Allow-Credentials','true');
			//ctx.cookies.set('XSRF-TOKEN','myKey',{httpOnly:false});
			if(ctx.method=='OPTIONS')return ctx.body='1';
			await next();
		})
	}
	app.use(mount('/router',
		convert(session({
			key:hidMsn.routerKey,
			maxAge:20000
		},app))));
	app.use(mount('/router',rootRouter.routes()));
	app.use(mount('/input',
		convert(session({
			key:hidMsn.inputKey,
			maxAge:86400000
		},app))
		))
	app.use(mount('/input',inputRouter.routes()));
	app.use(mount('/admin6',
		convert(session({
			key:hidMsn.adminKey
		},app))
		))
	app.use(mount('/admin6',adminRouter.routes()));
	let staticPath=path.join(__dirname,'static');
	app.use(mount('/static',async(ctx,next)=>{
		ctx.set('Content-Encoding','gzip');
		ctx.set('Cache-Control','max-age=16600');
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
	app.listen(3000);

})
