
	Array.prototype.AsyncForEach=function(fn,endFn){
    	this.length?fn(this[0],()=>{this.slice(1).AsyncForEach(fn,endFn)}):endFn();
	}
var req=require('request');
var fs=require('fs');
var iconv=require('iconv-lite');
var htmlparser=require('htmlparser2');
var CSSselect=require('css-select');
var urlUt=require('url');
var getPagecount=0,writeError=0,allCount=0,allError=0;
const hostPath='http://www.xigua110.com/',
	 EventEmitter=require('events'),
	 event=new EventEmitter(),
	 mongoose=require('./mongodb.js'),
	 reqTimeout=3000,
	 cssQuery=[
	'ul li a.xq.bg',
	'.detail-pic img,.detail-info,#play_1 li:first-of-type a,.vod_content',
	'.playing script'
];
let movieObj,movieArr=[],category;
resetMovieObj();
let visit=(url)=>{
	url=urlUt.resolve(hostPath, url);
	return new Promise(resolve=>{
		req({method:'get',
			url:url,
			encoding:null,
			timeout:reqTimeout
		},(err,r,body)=>{
			if(err)resolve(false);
			resolve(iconv.decode(body,'gb2312'));
		})
	})
}
let select=(content,query,callback)=>{
	let run=new htmlparser.Parser(new htmlparser.DomHandler((err,dom)=>{
		if(err)return callback(false);
		let result=CSSselect(query,dom);
		callback(result);
	}));
	run.write(content);
	run.done();
}
let getMsn=(url,query)=>{
	return new Promise(resolve=>{
		visit(url).then(content=>{
			if(!content)resolve(false);
			select(content,query,elems=>{
				if(!elems)resolve(false);
				resolve(elems);
			});
		})
	})
}

let dealJs=(path1,callback)=>{
	req.get(urlUt.resolve(hostPath,path1),{timeout:reqTimeout},(err,req,body)=>{
		if(err)return callback();
		let str=unescape(body).match(/\(.+\)$/).toString(),arr=[];
		str=str.slice(2,str.length-2);
		str.split('#').forEach(v=>{
			for (i of v.split('$')){
				if(/ftp/.test(i)){
					arr.push(i);
					break;
				}
			}
		});
		movieObj.playData.xigua=arr;
		movieArr.push(movieObj);
		resetMovieObj();
		callback();
	});
}
let insertMany=(arr,callback)=>{
	arr.AsyncForEach(
		(v,next)=>{
			v.category=category;
			mongoose.myMethod.saveMovie(category,v).then(err=>{
				if(!err)writeError++;
				next();
			})
		},
		()=>{
			console.log('get this page the count of \x1b[32m'+getPagecount+'\x1b[37m ,and error of \x1b[31m'+writeError+'\x1b[37m');
			allCount+=getPagecount;
			allError+=writeError;
			getPagecount=0;
			writeError=0;
			movieArr=[];
			callback();
		}
	)
}
let getOnePage=function(getPath,callback){
	getMsn(getPath,cssQuery[0]).then(elems=>{
		if(!elems)return false;
		elems.AsyncForEach(
			(v,next)=>{
				getMsn(v.attribs.href,cssQuery[1]).then(elems=>{
					if(!elems)return next();
					setMovie(elems[0],getTextNodes(elems[1]),elems[3]);
					let url=elems[2].attribs.href;
					if(!url)return next();				
					getMsn(url,cssQuery[2]).then(elems=>{
						if(!elems)return next();
						dealJs(elems[0].attribs.src,next);
					})			
				});
			},
			()=>{
				let arr=reverseArr(movieArr);
				insertMany(arr,callback);
			}
		)
	})
}
let getOneAll=function(baseName,maxSize,category){
	if(maxSize>1){
		getOnePage(baseName+'/index'+maxSize+'.htm',()=>{
			maxSize--;
			console.log('readNextPage :'+maxSize);
			getOneAll(baseName,maxSize);	
		})
	}else if(maxSize==1){
		getOnePage(baseName+'/index.htm',()=>{
			console.log('end');
			console.log('all get movies count is'+allCount);
			console.log('all get errors count is'+allError);
		})
	}
}
//begin:
category='wars';
getOneAll('/war',3);

function getTextNodes(obj,pure=false){
	let arr=[],data;
	let traverse=(obj)=>{
		if(typeof obj!='object')return;
		if(!obj.children)return;
		obj.children.forEach(v=>{
			if(!v.children&&v.type==='text'){
				data=v.data.replace(/(\r|\n|\t)/g,'');
				data?arr.push(data):0;
			}else if(!(pure&&v.name=='a')){
				traverse(v);
			}
		})
	};
	traverse(obj);
	return arr;
}

function setMovie(imgElem,textNodes,itdElem){
	movieObj.img=imgElem.attribs.src;
	movieObj.itd=getTextNodes(itdElem,true).join('');
	movieObj.name=textNodes[0];
	console.log(++getPagecount+' success get the name of: '+movieObj.name);
	for(let i =0,len=textNodes.length;i<len;i++){
		if(/主演/.test(textNodes[i])){
			movieObj.actors=textNodes[i+1];
		}else if(/地区/.test(textNodes[i])){
			movieObj.region=textNodes[i+1];
		}else if(/语言/.test(textNodes[i])){
			movieObj.lag=textNodes[i+1];
		}else if(/年份/.test(textNodes[i])){
			movieObj.year=textNodes[i+1];
		}
	}
}
function resetMovieObj(){
	movieObj={
	name:undefined,
	actors:undefined,
	region:undefined,
	lag:undefined, //languague
	year:undefined,
	img:undefined,
	playData:{},
	itd:undefined
	}
}
function reverseArr(arr){
	let arr2=[],len=arr.length;
	while(len--){
		arr2.push(arr[len]);
	}
	return arr2;
}