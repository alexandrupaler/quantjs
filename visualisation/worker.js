// var Module = {
// 	noInitialRun : true,
// 	noExitRuntime : true
// };

importScripts('libs/three.js');
importScripts('libs/PalerBoxBufferGeometry.js');
// importScripts('../convertft.js');

var d = new Date();
var n = d.getTime(); 

function profile(msg)
{
  console.log(new Date().getTime() + " " + msg);
}

function echoGeometries()
{
  console.log("vtx " + self.totalBounding.getAttribute('position').array.length);
  console.log("vtx " + self.totalPrimal.getAttribute('position').array.length);
  console.log("vtx " + self.totalDual.getAttribute('position').array.length);
  
  console.log("idx " + self.totalBounding.getIndex().array.length);
  console.log("idx " + self.totalPrimal.getIndex().array.length);
  console.log("idx " + self.totalDual.getIndex().array.length);
}

function copyToBuffer(buffer, vectors)
{
  var offset = 0;
  for ( var i = 0, l = vectors.length; i < l; i ++ ) 
  {
    buffer[i] = vectors[i];
  }
}
/*
.position = .P
.defects = .D
.defects.primal = .D.p
.defects.dual = .D.d
.corrs = .C
*/

function makeBoundingBoxes(plumb)
{
  self.totalBounding = new THREE.PalerBoxBufferGeometry(1,1,1);
  self.totalPrimal = new THREE.PalerBoxBufferGeometry(1,1,1);
  self.totalDual = new THREE.PalerBoxBufferGeometry(1,1,1);
  
	for (var i=0; i<plumb.plumbs.length; i++)
  {
		var boxparam = plumb.plumbs[i].P;
		
		self.totalBounding.addBox(boxparam, [1, 1, 1]);
		
		var ppd = plumb.plumbs[i].D;
		
		//if(ppd.p[0] == 1)
		var bitPosition = 8;
		
		if((ppd.p & bitPosition) == bitPosition)
		{
		  var dim = [0.3, 0.3, 0.3];
		  
		  //var b1 = constructBox(boxparam, dim, 'orange', false);
		  //self.totalPrimal.merge(b1);
		  self.totalPrimal.addBox(boxparam, dim);
		  
		  for(var j=1; j<4; j++)
		  {
		    //if(ppd.p[j] == 0)
		    bitPosition = 1 << (3 - j);
		    if((ppd.p & bitPosition) == bitPosition)
		    {
				  dim[j - 1] = 0.7;
				  boxparam[ j - 1] += 0.3;
				  
				  //var b2 = constructBox(boxparam, dim, 'red', false);
				  //self.totalPrimal.merge(b2);
				  self.totalPrimal.addBox(boxparam, dim);
				   
				  dim[j - 1] = 0.3;
				  boxparam[ j - 1] -= 0.3;
		    }
		  }
		}
		
		//if(ppd.d[0] == 1)
		bitPosition = 8;
		if((ppd.d & bitPosition) == bitPosition)
		{
		  boxparam[0] += 0.5;
		  boxparam[1] += 0.5;
		  boxparam[2] += 0.5;
		  
		  var dim = [0.3, 0.3, 0.3];
		  //var b3 = constructBox(boxparam, dim, 'violet', false);
		  //self.totalDual.merge(b3);
		  self.totalDual.addBox(boxparam, dim);
		
		  for(var j=1; j<4; j++)
		  {
	      //if(ppd.d[j] == 0)
	      bitPosition = 1 << (3 - j);
      	if((ppd.d & bitPosition) == 0)
	        continue;

	      dim[j - 1]= 0.7;
	      boxparam[ j - 1] += 0.3;
	      
		    //var b4 = constructBox(boxparam, dim, 'blue', false);
		    //self.totalDual.merge(b4);
		    self.totalDual.addBox(boxparam, dim);
		    
		    boxparam[ j - 1] -= 0.3;
		    dim[j - 1] = 0.3;
		  }
		}
	}
	
	profile("struct");
	
	self.totalBounding.addAttributes();
	self.totalPrimal.addAttributes();
	self.totalDual.addAttributes();
	
	profile("built");
}

self.addEventListener('message', function(msg) {
  // We received a message from the main thread!
  // do some computation that may normally cause the browser to hang
  
  if(msg.data.type == 'load')
  {
    profile("start");
		
		eval(msg.data.window.Fs.readFile("circuit.raw.in.adam?id=" + n, { encoding: 'utf8' }));
		//importScripts('../circuit.raw.in.adam?id='+n);
		
		profile(plumb);
    
    var ldata = makeBoundingBoxes(plumb);
    echoGeometries();
    profile("made boxes");
    
    self.postMessage({
      type: 'loaded',
      b1v: self.totalBounding.getAttribute('position').array.length,
      b2v: self.totalPrimal.getAttribute('position').array.length,
      b3v: self.totalDual.getAttribute('position').array.length,
      b1i: self.totalBounding.getIndex().array.length,
      b2i: self.totalPrimal.getIndex().array.length,
      b3i: self.totalDual.getIndex().array.length
    });
    
  }
  else if(msg.data.type == 'fill')
  {
    profile("copy1");
    copyToBuffer( msg.data.buff1v, self.totalBounding.getAttribute('position').array);
    copyToBuffer( msg.data.buff2v, self.totalPrimal.getAttribute('position').array );
    copyToBuffer( msg.data.buff3v, self.totalDual.getAttribute('position').array );
    copyToBuffer( msg.data.buff1i, self.totalBounding.getIndex().array);
    copyToBuffer( msg.data.buff2i, self.totalPrimal.getIndex().array );
    copyToBuffer( msg.data.buff3i, self.totalDual.getIndex().array );
    profile("copy2");
        
    //  now send back the results
    self.postMessage({
      type: 'results',
          buff1v : msg.data.buff1v,
          buff2v : msg.data.buff2v,
          buff3v : msg.data.buff3v,
          buff1i : msg.data.buff1i,
          buff2i : msg.data.buff2i,
          buff3i : msg.data.buff3i,
        }, [msg.data.buff1v.buffer, msg.data.buff2v.buffer, msg.data.buff3v.buffer, msg.data.buff1i.buffer, msg.data.buff2i.buffer, msg.data.buff3i.buffer]);
  }
})

/*
	Without worker
	Load direct.
	The code from visualiser that used a worker, but I had no idea how to load from
	the mem FS the json file in the worker
*/

// WebGLVisualiser.prototype.plumbingView = function()
// {
//   this.pre_init();

//   var worker = new Worker('visualisation/worker.js');
  
// 	var objdata = {  
//     type: 'load',
//     window: window
//     // ,
//     // plumb: '../circuit.raw.in.adam'
//   }  
  
//   worker.postMessage(objdata);

//   console.log("Plumbing pieces!!!");
 
// 	worker.onmessage = function(e) {  
//     var data = e.data;
    
//     if (data.type === 'loaded') {
//       /*console.log("x " + data.b1v + " " + data.b1c + " " + data.b1n + " " 
//         + data.b2v + " " + data.b2c + " " + data.b2n + " " 
//         + data.b3v + " " + data.b3c + " " + data.b3n);*/
        
//         this.buff1v = new Float32Array(Number(data.b1v));
//         this.buff2v = new Float32Array(Number(data.b2v));
//         this.buff3v = new Float32Array(Number(data.b3v));
//         this.buff1i = new Uint32Array(Number(data.b1i));
//         this.buff2i = new Uint32Array(Number(data.b2i));
//         this.buff3i = new Uint32Array(Number(data.b3i));
        
//         worker.postMessage({
//           type : 'fill',
//           buff1v : this.buff1v,
//           buff2v : this.buff2v,
//           buff3v : this.buff3v,
//           buff1i : this.buff1i,
//           buff2i : this.buff2i,
//           buff3i : this.buff3i
//         }, [this.buff1v.buffer, this.buff2v.buffer, this.buff3v.buffer, this.buff1i.buffer, this.buff2i.buffer, this.buff3i.buffer]);
//     }
//     else if (data.type === 'results') 
//     {
//       var b1 = new THREE.BufferGeometry();
//       b1.addAttribute( 'position', new THREE.BufferAttribute( data.buff1v, 3) );
//       b1.setIndex(new THREE.BufferAttribute( data.buff1i, 1));
//       b1.computeVertexNormals();
      
//       var b2 = new THREE.BufferGeometry();
//       b2.addAttribute( 'position', new THREE.BufferAttribute( data.buff2v, 3 ) );
//       b2.setIndex(new THREE.BufferAttribute( data.buff2i, 1));
//       b2.computeVertexNormals();
      
//       var b3 = new THREE.BufferGeometry();
//       b3.addAttribute( 'position', new THREE.BufferAttribute( data.buff3v, 3 ) );
//       b3.setIndex(new THREE.BufferAttribute( data.buff3i, 1));
//       b3.computeVertexNormals();
      
//       // b1.computeBoundingBox();
//       // b2.computeBoundingBox();
//       // b3.computeBoundingBox();
      
//       var boundingm = new THREE.MeshBasicMaterial({
//         wireframe: true,
//         color: 'green'
//         });
        
//       var primalm = new THREE.MeshLambertMaterial({color: 'red', 
//                       side: THREE.DoubleSide, 
//                     shading: THREE.FlatShading, wireframe: false});
                      
//       var dualm = new THREE.MeshLambertMaterial({color: 'blue', 
//                     side: THREE.DoubleSide, 
//                     shading: THREE.FlatShading, wireframe: false});
      
//       var boundingmesh = new THREE.Mesh(b1, boundingm);
//       var primalmesh = new THREE.Mesh(b2, primalm);
//       var dualmesh = new THREE.Mesh(b3, dualm);
      
//       this.scene.add(boundingmesh);
//       this.scene.add(primalmesh);
//       this.scene.add(dualmesh);
//     }
//   }

//   console.log(worker);
// }