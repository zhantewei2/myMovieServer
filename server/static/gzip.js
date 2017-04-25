var fs=require('fs');
var zlib=require('zlib');
var path=require('path');
var orginName,gzipName;
Array.prototype.AsyncForEach = function (fn, endFn) {
        this.length ? fn(this[0], ()=>{this.slice(1).AsyncForEach(fn, endFn); }) : endFn();
};
for (let v of process.argv){
	let str=v.match(/name=/);
	let folder=v.match(/folder=/);
	if(!!str){
		let name=v.slice('name='.length);
		fs.access(name,(err)=>{
			if(!!err){
				console.log('file is noexist');
				return;
			}else{
				makeGzip(name,name+'.gzip',()=>{console.log('gzip success')});
				return;
			}
		})	
	}else if(!!folder){
		orginName=v.slice('folder='.length);
		gzipName=orginName+'.gzip';
		mkdir('/').then(realPath=>{
			readDir(realPath)
		})
	}
}



function readFile(fileName,parentPath,next){
	let realPath=path.join(orginName,parentPath,fileName);
	let mkPath=path.join(parentPath,fileName);
	fs.stat(realPath,(err,data)=>{
		if(data.isDirectory()){
			mkdir(mkPath).then(realPath=>{
				readDir(realPath,next);
			})
		}else{
			makeGzip(realPath,path.join(gzipName,mkPath),next);
		}
	})
}
function readDir(pathName,nextMain){
	let realPath=path.join(orginName,pathName);
	fs.readdir(realPath,(err,data)=>{
		data.AsyncForEach(
			(v,next)=>{
				readFile(v,pathName,next);
			},
			()=>{
				nextMain?nextMain():0;
			}
		);
	})
}
function mkdir(pathName){
	return new Promise(r=>{
		fs.mkdir(path.join(gzipName,pathName),()=>{
			r(pathName);
		})
	})
}
function makeGzip(inpPath,outPath,fn){
	fs.readFile(inpPath,(err,data)=>{
		fs.writeFile(outPath,zlib.gzipSync(data),()=>{
			fn?fn():0;
		})
	})
}
function makeGzip2(inpPath,outPath,fn){
	console.log(inpPath);
	const inp=fs.createReadStream(inpPath);
	const out=fs.createWriteStream(outPath);
	out.on('finish',()=>{
		fn?fn():0;
	})
	inp.on('data',(chunk)=>{
		out.write(zlib.gzipSync(chunk));
	});
	inp.on('end',()=>{
		out.end();
	})
}
