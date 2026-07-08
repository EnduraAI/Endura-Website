/* ============================================================
   ENDURA — 3D ASSET EXPLORER  (benchmark build)
   Procedural offshore platform + onshore plant.
   Nine domains mapped to parts; click to inspect; assemble intro.
   ============================================================ */
(function () {
  if (typeof THREE === 'undefined') {
    var l = document.getElementById('xpLoading');
    if (l) l.textContent = '3D engine unavailable';
    return;
  }

  var DOMAINS = [
    { id:'struct',  name:'Structural Data', score:38, band:'low', gap:'±$34M · unverified as-builts',  note:'Primary-steel as-builts unverified against survey. Drives severance points, lift weights and rigging design.' },
    { id:'hazmat',  name:'Hazardous Materials', score:41, band:'low', gap:'±$22M · no current inventory',  note:'No current NORM / asbestos inventory. Drives disposal routing, PPE regime and waste-slot booking.' },
    { id:'isol',    name:'Isolation & Containment', score:44, band:'low', gap:'±$18M · records incomplete',    note:'Isolation philosophy and line-status records incomplete. Drives make-safe scope and campaign duration.' },
    { id:'asbuilt', name:'As-Built Drawings', score:55, band:'mid', gap:'±$11M · post-2009 mods',        note:'Topside / plant modifications not back-captured. Drives removal sequencing and strengthening assumptions.' },
    { id:'pid',     name:'P&IDs',          score:62, band:'mid', gap:'±$7M · revisions unreconciled',  note:'Partial P&ID set; revisions unreconciled. Drives flushing / cleaning scope and hydrocarbon inventory.' },
    { id:'process', name:'Waste Classification', score:64, band:'mid', gap:'moderate confidence',           note:'Waste classification partially complete; disposal pathways not fully documented. Drives disposal routing and volume estimates.' },
    { id:'subsea',  name:'Well P&A', score:71, band:'mid', gap:'moderate confidence',           note:'Well completion and abandonment records reasonable; some programme age. Influences P&A scope and duration.' },
    { id:'marine',  name:'Weight Control', score:79, band:'ok',  gap:'good coverage',                 note:'Weight control register is current and verified. Supports lift planning confidence; low documentation risk.' },
    { id:'insp',    name:'Inspection Records', score:84, band:'ok',  gap:'good coverage',                 note:'Inspection and integrity reporting is recent and complete. Strongest domain in this readout.' }
  ];
  var COL = { low:0xC85040, mid:0xE8A24A, ok:0x3DA18C };
  var BASE = 0x7d8c98;
  var EDGE = { low:0xE07A5F, mid:0xE8A24A, ok:0x5BC2AE };

  var canvas = document.getElementById('xpCanvas');
  var box = canvas.parentElement;
  var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0C1218, 0.016);
  var camera = new THREE.PerspectiveCamera(42,1,0.1,1000);

  scene.add(new THREE.HemisphereLight(0xbfd8e8,0x0C1218,0.85));
  var key = new THREE.DirectionalLight(0xfff2e0,0.9); key.position.set(16,26,14); scene.add(key);
  var rim = new THREE.DirectionalLight(0xE8A24A,0.5); rim.position.set(-14,10,-12); scene.add(rim);
  var fill = new THREE.DirectionalLight(0x6da0c0,0.35); fill.position.set(0,-6,14); scene.add(fill);

  var root = new THREE.Group(); scene.add(root);
  var partMap = {}, allParts = [], labels = [];

  // schematic material: visible surface + bright edges, reads like an engineering model
  function makeMat(band){
    return new THREE.MeshStandardMaterial({ color:0x223240, roughness:0.45, metalness:0.25,
      emissive:COL[band], emissiveIntensity:0.18, transparent:true, opacity:0.88 });
  }
  function tag(mesh,domId,band){
    mesh.userData.dom=domId; mesh.userData.band=band; mesh.userData.baseY=mesh.position.y;
    // add edge lines for the schematic look
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 25),
      new THREE.LineBasicMaterial({ color: EDGE[band], transparent:true, opacity:0.95 })
    );
    mesh.add(edges); mesh.userData.edges = edges;
    if(!partMap[domId]) partMap[domId]=[];
    partMap[domId].push(mesh); allParts.push(mesh);
  }
  function cyl(rt,rb,h,seg,band){ return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12), makeMat(band)); }
  function boxm(w,h,d,band){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), makeMat(band)); }
  function sph(r,band){ return new THREE.Mesh(new THREE.SphereGeometry(r,16,16), makeMat(band)); }

  /* ---------- OFFSHORE ---------- */
  function buildOffshore(){
    var g=new THREE.Group();
    var sea=new THREE.Mesh(new THREE.PlaneGeometry(160,160),
      new THREE.MeshStandardMaterial({color:0x123040,roughness:0.3,metalness:0.3,transparent:true,opacity:0.55}));
    sea.rotation.x=-Math.PI/2; sea.position.y=-7.5; g.add(sea);
    // legs
    [[-3.2,-3.2],[3.2,-3.2],[-3.2,3.2],[3.2,3.2]].forEach(function(p){
      var leg=cyl(0.42,0.72,14,12,'low'); leg.position.set(p[0],-2.6,p[1]); tag(leg,'struct','low'); g.add(leg);
    });
    function brace(x1,z1,x2,z2,y){
      var v1=new THREE.Vector3(x1,y,z1),v2=new THREE.Vector3(x2,y,z2),len=v1.distanceTo(v2);
      var b=cyl(0.15,0.15,len,6,'low'); b.position.copy(v1).lerp(v2,0.5);
      b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.clone().sub(v1).normalize());
      tag(b,'struct','low'); g.add(b);
    }
    [-6.5,-1.5,3.5].forEach(function(y){ brace(-3.2,-3.2,3.2,3.2,y); brace(3.2,-3.2,-3.2,3.2,y);
      brace(-3.2,-3.2,3.2,-3.2,y); brace(-3.2,3.2,3.2,3.2,y); });
    // riser + seabed pipe (subsea)
    var riser=cyl(0.28,0.28,13,10,'mid'); riser.position.set(3.6,-3,3.6); tag(riser,'subsea','mid'); g.add(riser);
    var pipe=cyl(0.34,0.34,22,10,'mid'); pipe.rotation.z=Math.PI/2; pipe.position.set(11,-9.4,3.6); tag(pipe,'subsea','mid'); g.add(pipe);
    // decks (as-builts)
    var deck=boxm(9.4,0.7,9.4,'mid'); deck.position.set(0,4.6,0); tag(deck,'asbuilt','mid'); g.add(deck);
    var deck2=boxm(8.2,0.55,8.2,'mid'); deck2.position.set(0,7.6,0); tag(deck2,'asbuilt','mid'); g.add(deck2);
    // process modules
    [[-2.5,-2],[1.6,-2.2],[-2,1.9]].forEach(function(p){
      var m=boxm(2.3,2.6,2.3,'mid'); m.position.set(p[0],6.3,p[1]); tag(m,'process','mid'); g.add(m); });
    // P&ID pipe rack
    for(var i=0;i<6;i++){ var pr=cyl(0.07,0.07,5.2,6,'mid'); pr.rotation.z=Math.PI/2;
      pr.position.set(0.2,5.5+i*0.17,2.7); tag(pr,'pid','mid'); g.add(pr); }
    // isolation valves
    [[2.2,5.9,0],[2.5,5.9,0.5],[1.9,5.9,-0.4]].forEach(function(p){
      var v=sph(0.42,'low'); v.position.set(p[0],p[1],p[2]); tag(v,'isol','low'); g.add(v); });
    // hazmat tank
    var tank=cyl(1.35,1.35,2.8,18,'low'); tank.position.set(2.7,6.4,2.5); tag(tank,'hazmat','low'); g.add(tank);
    // marine crane
    var boom=boxm(0.4,0.4,7.5,'ok'); boom.position.set(-3.2,9.4,0); boom.rotation.x=-0.42; tag(boom,'marine','ok'); g.add(boom);
    var cbase=cyl(0.5,0.5,2.6,12,'ok'); cbase.position.set(-3.2,9,2.4); tag(cbase,'marine','ok'); g.add(cbase);
    // inspection helideck
    var heli=cyl(3.1,3.1,0.3,20,'ok'); heli.position.set(0.5,10,0); tag(heli,'insp','ok'); g.add(heli);
    g.position.y=2.5;
    return g;
  }

  /* ---------- ONSHORE ---------- */
  function buildOnshore(){
    var g=new THREE.Group();
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),
      new THREE.MeshStandardMaterial({color:0x26281f,roughness:0.95,metalness:0}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-0.05; g.add(ground);
    // rack frame (structural)
    for(var x=-7;x<=7;x+=3.5){
      var p1=boxm(0.32,5.4,0.32,'low'); p1.position.set(x,2.7,-2.2); tag(p1,'struct','low'); g.add(p1);
      var p2=boxm(0.32,5.4,0.32,'low'); p2.position.set(x,2.7,2.2); tag(p2,'struct','low'); g.add(p2);
    }
    var bm1=boxm(15,0.32,0.32,'low'); bm1.position.set(0,5.4,-2.2); tag(bm1,'struct','low'); g.add(bm1);
    var bm2=boxm(15,0.32,0.32,'low'); bm2.position.set(0,5.4,2.2); tag(bm2,'struct','low'); g.add(bm2);
    // process columns
    var c1=cyl(0.95,0.95,9.5,18,'mid'); c1.position.set(-4.5,4.75,0); tag(c1,'process','mid'); g.add(c1);
    var c2=cyl(0.72,0.72,7.5,18,'mid'); c2.position.set(4.8,3.75,1); tag(c2,'process','mid'); g.add(c2);
    var c3=cyl(0.6,0.6,6,18,'mid'); c3.position.set(1.5,3,-1.5); tag(c3,'process','mid'); g.add(c3);
    // hazmat tanks
    var t1=cyl(2.3,2.3,3.6,24,'low'); t1.position.set(8.5,1.8,-4.5); tag(t1,'hazmat','low'); g.add(t1);
    var t2=cyl(1.9,1.9,3.2,24,'low'); t2.position.set(4,1.6,-5.5); tag(t2,'hazmat','low'); g.add(t2);
    // isolation skids
    [[0,0.7,3.8],[1.1,0.7,3.8],[-1.1,0.7,4]].forEach(function(p){
      var v=boxm(0.85,1.3,0.85,'low'); v.position.set(p[0],p[1],p[2]); tag(v,'isol','low'); g.add(v); });
    // P&ID pipe runs
    for(var i=0;i<5;i++){ var pipe=cyl(0.11,0.11,13,8,'mid'); pipe.rotation.z=Math.PI/2;
      pipe.position.set(0,4.7+i*0.28,-2.2+i*0.11); tag(pipe,'pid','mid'); g.add(pipe); }
    // as-builts control building
    var bld=boxm(4.2,2.6,3.2,'mid'); bld.position.set(-7,1.3,4.5); tag(bld,'asbuilt','mid'); g.add(bld);
    // subsea -> buried services
    var grp=cyl(0.3,0.3,18,8,'mid'); grp.rotation.z=Math.PI/2; grp.position.set(0,0.3,6.5); tag(grp,'subsea','mid'); g.add(grp);
    // marine -> loadout slab
    var slab=boxm(6.5,0.3,4.5,'ok'); slab.position.set(7,0.18,5.5); tag(slab,'marine','ok'); g.add(slab);
    // inspection -> flare stack
    var flare=cyl(0.4,0.65,12,12,'ok'); flare.position.set(-9.5,6,-3.5); tag(flare,'insp','ok'); g.add(flare);
    g.position.y=0.5;
    return g;
  }

  var current=null, activeDom=null, assembleT=0, assembling=true;
  function setModel(kind){
    if(current) root.remove(current);
    partMap={}; allParts=[]; activeDom=null;
    current=(kind==='onshore')?buildOnshore():buildOffshore();
    root.add(current);
    resetView();
    assembleT=0; assembling=true;
  }
  function resetView(){
    allParts.forEach(function(m){
      m.material.emissive.setHex(COL[m.userData.band]);
      m.material.emissiveIntensity=0.18; m.material.opacity=0.88; m.material.color.setHex(0x223240);
      if(m.userData.edges){ m.userData.edges.material.color.setHex(EDGE[m.userData.band]); m.userData.edges.material.opacity=0.95; }
    });
  }
  function highlight(domId){
    activeDom=domId;
    allParts.forEach(function(m){
      var on=m.userData.dom===domId;
      m.material.emissiveIntensity=on?0.6:0.02;
      m.material.opacity=on?0.95:0.16;
      m.material.color.setHex(on?0x24343f:0x1a2730);
      if(m.userData.edges){
        m.userData.edges.material.color.setHex(on?EDGE[m.userData.band]:0x3a4650);
        m.userData.edges.material.opacity=on?1:0.18;
      }
    });
    document.querySelectorAll('.domrow').forEach(function(r){
      r.classList.toggle('active', r.getAttribute('data-dom')===domId);
    });
    var d=DOMAINS.find(function(x){return x.id===domId;});
    var c=d.band==='low'?'#E07A5F':d.band==='mid'?'#E8A24A':'#3DA18C';
    document.getElementById('xpDetail').innerHTML=
      '<div class="dh">'+d.name+' · <span style="font-family:IBM Plex Mono,monospace;font-size:15px;color:'+c+'">'+d.score+'/100</span></div>'+
      '<div class="dgap">'+d.gap+'</div><p>'+d.note+'</p>';
  }

  // domain list
  var list=document.getElementById('domList');
  DOMAINS.forEach(function(d){
    var row=document.createElement('div'); row.className='domrow'; row.setAttribute('data-dom',d.id);
    row.innerHTML='<span class="dl"><span class="dot '+d.band+'"></span>'+d.name+'</span><span class="sc '+d.band+'">'+d.score+'</span>';
    row.addEventListener('click',function(){ highlight(d.id); });
    list.appendChild(row);
  });

  // raycast click
  var ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  canvas.addEventListener('click',function(e){
    if(assembling) return;
    var r=canvas.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(mouse,camera);
    var hits=ray.intersectObjects(allParts,false);
    if(hits.length&&hits[0].object.userData.dom) highlight(hits[0].object.userData.dom);
  });

  // orbit
  var rotX=0.36,rotY=0.7,dist=34,dragging=false,px=0,py=0,autoRot=true;
  canvas.addEventListener('pointerdown',function(e){dragging=true;autoRot=false;px=e.clientX;py=e.clientY;});
  window.addEventListener('pointerup',function(){dragging=false;});
  window.addEventListener('pointermove',function(e){
    if(!dragging)return;
    rotY+=(e.clientX-px)*0.006; rotX+=(e.clientY-py)*0.006;
    rotX=Math.max(-0.15,Math.min(1.25,rotX)); px=e.clientX; py=e.clientY;
  });
  canvas.addEventListener('wheel',function(e){e.preventDefault();dist+=e.deltaY*0.025;dist=Math.max(16,Math.min(64,dist));},{passive:false});
  // touch pinch
  var lastTouchDist=null;
  canvas.addEventListener('touchmove',function(e){
    if(e.touches.length===2){
      var dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(lastTouchDist!=null){ dist+=(lastTouchDist-d)*0.05; dist=Math.max(16,Math.min(64,dist)); }
      lastTouchDist=d;
    }
  },{passive:true});
  canvas.addEventListener('touchend',function(){lastTouchDist=null;});

  function resize(){ var w=box.clientWidth,h=box.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize',resize);

  function animate(){
    requestAnimationFrame(animate);
    if(autoRot&&!assembling) rotY+=0.0020;
    // assemble intro: parts rise into place
    if(assembling){
      assembleT+=0.018;
      var p=Math.min(assembleT,1), e=1-Math.pow(1-p,3);
      allParts.forEach(function(m,idx){
        var delay=(idx/allParts.length)*0.5;
        var local=Math.max(0,Math.min(1,(p-delay)/(1-delay)));
        var le=1-Math.pow(1-local,3);
        m.position.y=m.userData.baseY - (1-le)*9;
        m.material.opacity=le*0.88;
        if(m.userData.edges) m.userData.edges.material.opacity=le*0.9;
      });
      if(p>=1){ assembling=false; allParts.forEach(function(m){m.position.y=m.userData.baseY;m.material.opacity=0.88; if(m.userData.edges) m.userData.edges.material.opacity=0.9;}); }
    }
    camera.position.x=Math.sin(rotY)*Math.cos(rotX)*dist;
    camera.position.z=Math.cos(rotY)*Math.cos(rotX)*dist;
    camera.position.y=Math.sin(rotX)*dist+8;
    camera.lookAt(0,4,0);
    renderer.render(scene,camera);
  }

  resize();
  setModel('offshore');
  var loadEl=document.getElementById('xpLoading'); if(loadEl) loadEl.style.display='none';
  animate();

  var bOff=document.getElementById('btnOffshore'), bOn=document.getElementById('btnOnshore');
  function resetDetail(){ document.getElementById('xpDetail').innerHTML='<p class="ph">Select a domain — on the list or the model — to see where its documentation gaps sit and what they drive.</p>';
    document.querySelectorAll('.domrow').forEach(function(r){r.classList.remove('active');}); }
  bOff.addEventListener('click',function(){bOff.classList.add('on');bOn.classList.remove('on');setModel('offshore');resetDetail();});
  bOn.addEventListener('click',function(){bOn.classList.add('on');bOff.classList.remove('on');setModel('onshore');resetDetail();});
})();
