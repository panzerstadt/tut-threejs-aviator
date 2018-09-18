// https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/

// settings
// --------
var Colors = {
  red: "#F52F57",
  brown: "#F79D5C",
  pink: "#F5986E",
  brownDark: "#23190f",
  blue: "#68c3c0"
};
// we always have white on top of the 5 theme colors
Colors.white = "#d8d0d1";

// make stuff
// ----------
window.addEventListener("load", init, false);

// entire setup process to run once, ending with an infinite loop
function init() {
  // setup the scene, camera and renderer
  createScene();
  // add lights
  createLights();
  // add objects
  createPlane();
  createSea();
  createSky();

  // add listeners for mouse and keybaord events
  document.addEventListener("mousemove", handleMouseMove, false);
  document.addEventListener("mousedown", handleMouseClick, false);
  document.addEventListener("mouseup", handleMouseClick, false);

  // start a loop that will update objects positions
  // and render the scene on each frame
  loop();
}

// the stage
var scene, camera;
var fieldOfView, aspectRatio, nearPlane, farPlane;
var HEIGHT, WIDTH;
var renderer, container;
function createScene() {
  //get width and height of screen
  // use them to setup the aspect ratio of the camera
  // and the size of the renderer

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // create the scene
  scene = new THREE.Scene();

  // add a fog effect to the scene
  // same color as the backgorund color used in the style sheet
  scene.fog = new THREE.Fog("#f7d9aa", 100, 950);

  // create the camera
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  // set the position of the camera
  camera.position.x = 0;
  camera.position.y = 200;
  camera.position.z = 100;

  // create the renderer
  renderer = new THREE.WebGLRenderer({
    // allow transparency to show the gradient background
    alpha: true,
    // activate anti-aliasing
    antialias: true
  });

  // define the size of the renderer (in this case, fill entire screen)
  renderer.setSize(WIDTH, HEIGHT);

  // enable shadow rendering
  renderer.shadowMap.enabled = true;

  // add the DOM element of the render to
  // the container we created in html
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize, false);
}

function handleWindowResize() {
  //udpate the height and width of the renderer and the camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  //console.log("window resizing to %sh, %sw", HEIGHT, WIDTH);
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

// the lights
var hemisphereLight, shadowLight, ambientLight;
function createLights() {
  // a hemisphere light is a gradient colored light
  // with the settings (sky col, ground col, intensity)
  hemisphereLight = new THREE.HemisphereLight("#aaaaaa", "#000000", 0.9);

  ambientLight = new THREE.AmbientLight("#BBDBB4", 0.3);

  // a directional light shines from a specific location
  // acts like the sun, meaning all rays are parallel
  shadowLight = new THREE.DirectionalLight("#ffffff", 0.9);

  // set the direction of the light
  shadowLight.position.set(150, 350, 350);

  // allow shadow casting
  shadowLight.castShadow = true;

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // define the resolution of the shadow, the higher the better
  // but also more expensive
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // to activate the lights, add them to the scene

  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

// creating objects directly in THREE.js (objects can be imported from a 3d modelling software also)
Sea = function() {
  // create the geometry of a cylinder
  // params: radius top, radius bottom, height, numver of segments on the radius, number of segments vertically
  var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
  // rotate the geometry on the x axis (90 degrees)
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // 'smooth' vertex folds
  geom.mergeVertices();

  // get vertices
  var l = geom.vertices.length;

  //array to store new data
  this.waves = [];

  for (var i = 0; i < l; i++) {
    var v = geom.vertices[i];

    // store some data
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: 5 + Math.random() * 15,
      speed: 0.016 + Math.random() * 0.032
    });
  }

  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: 0.6,
    flatShading: true
  });

  //craete an object in THREE.js, we have to create a mesh
  // mesh = geometry + material
  this.mesh = new THREE.Mesh(geom, mat);

  // allow the sea to receive the shadows
  this.mesh.receiveShadow = true;
};

Sea.prototype.moveWaves = function() {
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;

  for (var i = 0; i < l; i++) {
    var v = verts[i];
    // get associated data
    var vprops = this.waves[i];
    // update
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    // increment angle for the netx frame
    vprops.ang += vprops.speed;
  }

  // tell the renderer that the geometry of the sea has changed
  this.mesh.geometry.verticesNeedUpdate = true;
  sea.mesh.rotation.z += seaSpeed;
};

var sea;
function createSea() {
  sea = new Sea();

  // move it down
  sea.mesh.position.y = -600;

  // add the mesh of the sea to the scene
  scene.add(sea.mesh);
}

Cloud = function() {
  // create an empty container that will hold the different parts of the cloud
  this.mesh = new THREE.Object3D();

  // create a cube geometry
  // this shape will be duplicated to create a cloud
  // https://threejs.org/docs/index.html#api/en/geometries/BoxGeometry
  var geom = new THREE.BoxGeometry(20, 20, 20, 1, 1, 1);

  // create a material
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white
  });

  // duplicate the geometry a random number of times
  var nBlocks = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocks; i++) {
    // create the mesh by cloning the geometry
    var m = new THREE.Mesh(geom, mat);

    // set the position and rotatino of each cube randomly
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.y = Math.random() * Math.PI * 2;
    m.rotation.z = Math.random() * Math.PI * 2;

    // randomly scale the cube (equally)
    var s = 0.1 + Math.random() * 0.9;
    m.scale.set(s, s, s);

    // allow each cube to cast and to receive shadows
    m.castShadow = true;
    m.receiveShadow = true;

    this.mesh.add(m);
  }
};

Sky = function() {
  // create an empty container
  this.mesh = new THREE.Object3D();

  // choose the number of clouds to be scattered in the sky
  this.nClouds = 20;

  // to distribute the clouds consistently
  // we need to place them according to a uniform angle
  var stepAngle = (Math.PI * 2) / this.nClouds;

  // create the clouds
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();

    // set the rotaton and position of each cloud
    // for that we use trigo
    var a = stepAngle * i; // this is the final angle
    var h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

    // convert polar coordinated into cartesian coordinates
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;

    // rotate the cloud according to its position
    c.mesh.rotation.z = a + Math.PI / 2;

    // for a better result, we position the clouds
    // at random depths inside the scene
    c.mesh.position.z = -400 - Math.random() * 400;

    // we also set a random scale for each cloud
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    // add cloud mesh into the scene
    this.mesh.add(c.mesh);
  }
};

var sky;
function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

Airplane = function() {
  // box
  // https://threejs.org/docs/index.html#api/en/geometries/BoxGeometry
  //
  this.mesh = new THREE.Object3D();

  // create the cockpit
  var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
  var matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true
  });

  // move vertices
  geomCockpit.vertices[4].y -= 10;
  geomCockpit.vertices[4].z += 20;

  geomCockpit.vertices[5].y -= 10;
  geomCockpit.vertices[5].z -= 20;

  geomCockpit.vertices[6].y += 30;
  geomCockpit.vertices[6].z += 20;

  geomCockpit.vertices[7].y += 30;
  geomCockpit.vertices[7].z -= 20;

  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // create the engine
  var geomEngine = new THREE.BoxGeometry(15, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: true
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);

  // move the engine to the front
  engine.position.set(45, 0, 0);

  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // create the tail
  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true
  });
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);

  // move the tail to the back
  tailPlane.position.set(-40, 20, 0);

  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // create the wing
  var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true
  });

  // move vertices
  geomSideWing.vertices[4].z += 20;
  geomSideWing.vertices[5].z -= 20;

  //geomSideWing.vertices[6].y -= 10;
  geomSideWing.vertices[6].z += 20;

  //geomSideWing.vertices[7].y -= 10;
  geomSideWing.vertices[7].z -= 20;

  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);

  // move the engine to the front
  sideWing.position.set(0, 10, 0);

  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // propeller
  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  var matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: true
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // blades
  var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
    flatShading: true
  });

  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);

  // create wheels
  geom_base = function(x, y, z, xpos, ypos, zpos, col) {
    var geomWheel = new THREE.BoxGeometry(x, y, z, 1, 1, 1);
    var matWheel = new THREE.MeshPhongMaterial({
      color: col,
      flatShading: true
    });
    var wheel = new THREE.Mesh(geomWheel, matWheel);
    wheel.position.set(xpos, ypos, zpos);
    //wheel.rotation.set(0, 0, 2.25);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    return wheel;
  };

  wheel = function(x, y, z, xpos, ypos, zpos) {
    outer = geom_base(x, y, z, xpos, ypos, zpos, Colors.brownDark);
    inner = geom_base(x / 2, y / 2, z + 2, xpos, ypos, zpos, Colors.brown);
    return { outer: outer, inner: inner };
  };

  backWheel = wheel(12, 12, 5, -30, -8, 0);
  this.mesh.add(backWheel.outer);
  this.mesh.add(backWheel.inner);

  wheelSupport = geom_base(15, 5, 8, -28, -2, 0, Colors.red);
  wheelSupport.rotation.set(0, 0, 1.3); // radians
  this.mesh.add(wheelSupport);

  frontWheel_1 = wheel(25, 25, 5, 30, -20, -30);
  this.mesh.add(frontWheel_1.outer);
  this.mesh.add(frontWheel_1.inner);

  frontWheel_2 = wheel(25, 25, 5, 30, -20, 30);
  this.mesh.add(frontWheel_2.outer);
  this.mesh.add(frontWheel_2.inner);

  // create window
  var geomWindow = new THREE.BoxGeometry(5, 20, 20, 1, 1, 1);
  var matWindow = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: true,
    transparent: true,
    opacity: 0.4
  });
  var window = new THREE.Mesh(geomWindow, matWindow);
  window.position.set(20, 30, 0);
  //wheel.rotation.set(0, 0, 2.25);
  window.castShadow = true;
  window.receiveShadow = true;
  this.mesh.add(window);
};

var airplane;
function createPlane() {
  airplane = new Airplane();
  airplane.mesh.scale.set(0.3, 0.3, 0.3);
  airplane.mesh.position.y = 200;
  airplane.mesh.position.z = -100;
  scene.add(airplane.mesh);
}

// interactivity
// -------------
var mousePos = { x: 0, y: 0 };
var propellerSpeed = 0.3;
var defaultSea = 0.005;
var seaSpeed = defaultSea;
var defaultSky = 0.01;
var skySpeed = defaultSky;
// handle mouse movement
function handleMouseMove(event) {
  // convert mouse position value to normalized -1 to 1
  //horizontal
  var tx = -1 + (event.clientX / WIDTH) * 2;
  // vertical
  // y axis is inverted for 2d (y goes down instead of up)
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseClick(event) {
  // change propeller speed
  if (event.type === "mousedown") {
    propellerSpeed = 0.7;
    seaSpeed = defaultSea * 2;
    skySpeed = defaultSky * 2;
  } else {
    propellerSpeed = 0.3;
    seaSpeed = defaultSea;
    skySpeed = defaultSky;
  }
}

function updatePlane() {
  // move the airplane betwene -100 and 100 on the horizontal axis
  // and vetween 25 and 175 on the vertical axis
  // depending on the mouse position form -1 to 1
  // so remap

  // direct
  // var targetX = normalize(mousePos.x, -1, 1, -100, 100);
  // var targetY = normalize(mousePos.y, -1, 1, 125, 275);
  // update the plane
  // airplane.mesh.position.x = targetX;
  // airplane.mesh.position.y = targetY;

  // smooth
  var targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
  var targetY = normalize(mousePos.y, -0.75, 0.75, 125, 275);
  // move the plane each frame by adding a fraction of the remaining distance
  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
  airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * 0.05;
  // rotate plane proportionally to the remaining distane
  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

  // console.log("current plane position");
  // console.log(targetX);
  // console.log(targetY);

  // and also don't forget to update the propeller
  airplane.propeller.rotation.x += propellerSpeed;
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

// looping sequence
// ----------------
// all the things the animation needs to do in the loop
// including animation and as well as calling itself recursively
function loop() {
  // animation
  // rotate the propeller, sea and sky
  sea.moveWaves();
  sky.mesh.rotation.z += skySpeed;

  // update plane on each frame
  updatePlane();

  renderer.render(scene, camera);

  // call the loop functions again recursively
  requestAnimationFrame(loop);
}
