// IE9
if(typeof console === "undefined") { var console = { log: function (logMsg) { } }; }

var camera, controls, scene, renderer, material;
var spheregeometry;
var vertices=[];
var edges=[];
var pointLight;

/*statistics*/
var stats = new Stats();

/*standby render*/
var renderLastMove = Date.now();
var renderRunning = false;
var renderStandbyAfter = 2000; // ms

// Run on startup
$(document).ready(main);
window.addEventListener("mousedown", function(){/*console.log("start"); */renderRunning = false; startAnimation()}, true);
window.addEventListener("mouseup", function(){/*console.log("stop"); */renderRunning = false}, true);
window.addEventListener("wheel", function(){/*console.log("scroll");*/renderRunning = false; startAnimation()}, true);

// ************ STARTUP *****************
function main() {
  stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  init();
  animate();
}

function init() {
    // Set up the container and renderer
    var $container = document.getElementById('container');
    var w=window,d=document,e=d.documentElement,g=d.getElementsByTagName('container')[0],x=w.innerWidth||e.clientWidth||g.clientWidth,y=w.innerHeight||e.clientHeight||g.clientHeight;
    var WIDTH=x;
    var HEIGHT=y;


    // Renderer
		renderer = Detector.webgl? new THREE.WebGLRenderer({preserveDrawingBuffer: true}): new THREE.CanvasRenderer();
    //renderer = new THREE.WebGLRenderer( { antialias: true });
    renderer.setSize(WIDTH, HEIGHT-20);
    renderer.setClearColor( 0xffffff, 1 );
    $container.appendChild(renderer.domElement);
    scene = new THREE.Scene();

// Center the camera
   var sx=0; var sy=0; var sz=0;
   /* for (var i=0; i<graph.nodes.length; ++i)
    {
        var n=graph.nodes[i];
        if (n[1]>sx){ sx=n[1]; }
        if (n[2]>sy){ sy=n[2]; }
        if (n[3]>sz){ sz=n[3]; }
    }*/
    
    // Camera
    camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, 0.1,10000);
    camera.position.set(0 ,0 , 10);
    //camera.up = new THREE.Vector3(-1,0,0);
    scene.add(camera);

    // Models
    spheregeometry=new THREE.SphereGeometry(.5, 3, 3)

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x552222);
    ambientLight.intensity=.1;
    scene.add(ambientLight);
    //scene.fog = new THREE.FogExp2( 0xffffff, -0.0025 );
    pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10000;
    pointLight.position.y = 100000;
    pointLight.position.z = 13000;
    scene.add(pointLight);

    // Materials
    //material1 = new THREE.MeshLambertMaterial({color: "red"});
    material1 = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2, transparent: true, opacity: 1});

    //material2 = new THREE.MeshLambertMaterial({color: "blue"});
    material2 = new THREE.LineBasicMaterial({ color: 0x0000FF, linewidth: 2, transparent: true, opacity: 1 });

    material3 = new THREE.MeshLambertMaterial({color: "green"});

    //material2.opacity=0;
    //material2.transparent=true;

    

    // Add controls
    controls = new THREE.TrackballControls(camera, $container);
    controls.target.set( sx/2, sy/2, sz/2 - sx*1.5);
	controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
		
	var worker = new Worker('./worker.js');
	
	var objdata = {  
	  type: 'load',
    plumb: 'circuit.raw.in.adam'
  }  
  
  worker.postMessage(objdata);
  
	worker.onmessage = function(e) {  
    var data = e.data;
    
    if (data.type === 'loaded') {
      /*console.log("x " + data.b1v + " " + data.b1c + " " + data.b1n + " " 
        + data.b2v + " " + data.b2c + " " + data.b2n + " " 
        + data.b3v + " " + data.b3c + " " + data.b3n);*/
        
        this.buff1v = new Float32Array(Number(data.b1v));
        this.buff2v = new Float32Array(Number(data.b2v));
        this.buff3v = new Float32Array(Number(data.b3v));
        this.buff1i = new Uint32Array(Number(data.b1i));
        this.buff2i = new Uint32Array(Number(data.b2i));
        this.buff3i = new Uint32Array(Number(data.b3i));
        
        worker.postMessage({
          type : 'fill',
          buff1v : this.buff1v,
          buff2v : this.buff2v,
          buff3v : this.buff3v,
          buff1i : this.buff1i,
          buff2i : this.buff2i,
          buff3i : this.buff3i
        }, [this.buff1v.buffer, this.buff2v.buffer, this.buff3v.buffer, this.buff1i.buffer, this.buff2i.buffer, this.buff3i.buffer]);
    }
    else if (data.type === 'results') {
    
    var b1 = new THREE.BufferGeometry();
    b1.addAttribute( 'position', new THREE.BufferAttribute( data.buff1v, 3) );
    b1.setIndex(new THREE.BufferAttribute( data.buff1i, 1));
    b1.computeVertexNormals();
    
    var b2 = new THREE.BufferGeometry();
    b2.addAttribute( 'position', new THREE.BufferAttribute( data.buff2v, 3 ) );
    b2.setIndex(new THREE.BufferAttribute( data.buff2i, 1));
    b2.computeVertexNormals();
    
    var b3 = new THREE.BufferGeometry();
    b3.addAttribute( 'position', new THREE.BufferAttribute( data.buff3v, 3 ) );
    b3.setIndex(new THREE.BufferAttribute( data.buff3i, 1));
    b3.computeVertexNormals();
    
   // b1.computeBoundingBox();
   // b2.computeBoundingBox();
   // b3.computeBoundingBox();
    
    var boundingm = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 'green'
      });
      
    var primalm = new THREE.MeshLambertMaterial({color: 'red', 
    								side: THREE.DoubleSide, 
  								shading: THREE.FlatShading, wireframe: false});
    								
    var dualm = new THREE.MeshLambertMaterial({color: 'blue', 
  								side: THREE.DoubleSide, 
  								shading: THREE.FlatShading, wireframe: false});
    
	    var boundingmesh = new THREE.Mesh(b1, boundingm);
	    var primalmesh = new THREE.Mesh(b2, primalm);
	    var dualmesh = new THREE.Mesh(b3, dualm);
	    
	    scene.add(boundingmesh);
      scene.add(primalmesh);
      scene.add(dualmesh);
    }
  }
}


function checkTime()
{
  /*either use the standby time 
    or return true when renderRunning is a semaphore*/
  return true;
  //return (renderLastMove + renderStandbyAfter >= Date.now());
}

function startAnimation()
{
  renderLastMove = Date.now();
  
  /*daca nu ruleaza inca animatia*/
  if (!renderRunning)
  {
    //verifica de are voie sa ruleze
    if(checkTime())
    {
      renderRunning = true;
      requestAnimationFrame(animate);
    }
  }
}

function animate()
{
  renderer.render(scene, camera);
  
  if (!checkTime() || !renderRunning)
  {
    renderRunning = false;
  }
  else
  {
    requestAnimationFrame(animate);
  }
  
  controls.update();
  stats.update();
}

