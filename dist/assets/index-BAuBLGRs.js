(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e){let t=e.split(/\r?\n/),n={title:``,artist:``,audioFilename:``,notes:[]},r=``;for(let e of t){let t=e.trim();if(!(!t||t.startsWith(`//`))){if(t.startsWith(`[`)&&t.endsWith(`]`)){r=t.slice(1,-1);continue}if(r===`General`||r===`Metadata`){let e=t.indexOf(`:`);if(e===-1)continue;let r=t.slice(0,e).trim(),i=t.slice(e+1).trim();r===`AudioFilename`&&(n.audioFilename=i),r===`Title`&&(n.title=i),r===`Artist`&&(n.artist=i)}if(r===`HitObjects`){let e=t.split(`,`);if(e.length<5)continue;let r=parseInt(e[0]),i=parseFloat(e[2])/1e3,a=Math.min(5,Math.round(r*6/512));n.notes.push({time:i,lane:a})}}}return n.notes.sort((e,t)=>e.time-t.time),n}var t=null,n=null,r=null,i=0,a=0,o=[null,null,null,null,null,null];function s(){t=new(window.AudioContext||window.webkitAudioContext)}async function c(e){t||s(),n=await t.decodeAudioData(e)}async function l(e,n){t||s(),o[e]=await t.decodeAudioData(n)}function u(){if(!t||!n)return;t.state===`suspended`&&t.resume(),r=t.createBufferSource(),r.buffer=n;let e=t.createGain();e.gain.value=.2,r.connect(e),e.connect(t.destination),r.start(0),i=t.currentTime}function ee(){if(r){try{r.stop()}catch{}r=null}}function te(){return!t||!i?0:t.currentTime-i+a}function ne(e){a=e/1e3}var re=[{freq:440,type:`sine`},{freq:500,type:`sine`},{freq:560,type:`sine`},{freq:620,type:`sine`},{freq:680,type:`sine`},{freq:740,type:`sine`}];function d(e){if(!t)return;if(o[e]){let n=t.createBufferSource(),r=t.createGain();n.buffer=o[e],n.connect(r),r.connect(t.destination),r.gain.value=.9,n.start(0);return}let{freq:n,type:r}=re[e],i=t.createOscillator(),a=t.createGain();i.connect(a),a.connect(t.destination),i.type=r,i.frequency.value=n;let s=t.currentTime;a.gain.setValueAtTime(.25,s),a.gain.exponentialRampToValueAtTime(1e-4,s+.08),i.start(s),i.stop(s+.08)}var ie=6,f={x:400,y:400},p=[`#AA0000`,`#AAAA00`,`#00AA00`,`#00AAAA`,`#0000AA`,`#AA00AA`],m=null,h=null;function ae(){m=document.getElementById(`game-canvas`),h=m.getContext(`2d`),h.fillStyle=`#ffffff`,h.fillRect(0,0,m.width,m.height)}function g(e){return{0:{x:f.x+320,y:f.y-140},1:{x:f.x+360,y:f.y},2:{x:f.x+320,y:f.y+140},3:{x:f.x-320,y:f.y+140},4:{x:f.x-360,y:f.y},5:{x:f.x-320,y:f.y-140}}[e]}function oe(e){e?(h.fillStyle=`rgba(255, 255, 255, 0.18)`,h.fillRect(0,0,m.width,m.height)):(h.fillStyle=`#ffffff`,h.fillRect(0,0,m.width,m.height))}function se(){h.beginPath(),h.arc(f.x,f.y,280,0,Math.PI*2),h.strokeStyle=`rgba(255,255,255,0.08)`,h.lineWidth=1.5,h.stroke(),h.beginPath(),h.arc(f.x,f.y,28,0,Math.PI*2),h.strokeStyle=`rgba(0,255,231,0.15)`,h.lineWidth=1,h.stroke();for(let e=0;e<ie;e++){let{x:t,y:n}=g(e),r=t-f.x,i=n-f.y,a=Math.sqrt(r*r+i*i),o=r/a,s=i/a,c=f.x+o*30,l=f.y+s*30;h.beginPath(),h.moveTo(c,l),h.lineTo(t-o*28,n-s*28),h.strokeStyle=p[e]+`18`,h.lineWidth=1,h.stroke()}}var ce=[`J`,`K`,`L`,`D`,`S`,`A`];function le(e=new Set){for(let t=0;t<ie;t++){let{x:n,y:r}=g(t),i=p[t],a=e.has(t);if(a){h.save(),h.globalCompositeOperation=`lighter`;let e=h.createRadialGradient(n,r,0,n,r,36);e.addColorStop(0,i+`88`),e.addColorStop(1,i+`00`),h.beginPath(),h.arc(n,r,36,0,Math.PI*2),h.fillStyle=e,h.fill(),h.restore()}h.beginPath(),h.arc(n,r,22,0,Math.PI*2),h.strokeStyle=a?i:i+`66`,h.lineWidth=a?2.5:1.5,h.stroke(),a&&(h.beginPath(),h.arc(n,r,22,0,Math.PI*2),h.fillStyle=i+`33`,h.fill()),h.font=`11px "Share Tech Mono", monospace`,h.textAlign=`center`,h.textBaseline=`middle`,h.fillStyle=a?i:i+`99`,h.fillText(ce[t],n,r)}}function ue(e,t){let n=(t-e.spawnWall)/1e3/e.travelTime,r=g(e.lane),i=Math.min(n,1),a=f.x+(r.x-f.x)*i,o=f.y+(r.y-f.y)*i,s=p[e.lane];if(e.hit){fe(a,o,s,(t-e.hitWall)/350);return}if(e.missed){let n=(t-e.missWall)/500;h.globalAlpha=Math.max(0,1-n),_(a,o,`#aaa`,9),h.globalAlpha=1;return}de(a,o,s),h.save(),h.globalCompositeOperation=`lighter`;let c=Math.max(0,n-.7)/.3,l=24+c*10,u=h.createRadialGradient(a,o,0,a,o,l);u.addColorStop(0,s+`99`),u.addColorStop(1,s+`00`),h.beginPath(),h.arc(a,o,l,0,Math.PI*2),h.fillStyle=u,h.fill(),h.restore(),_(a,o,s,9+c*3)}function _(e,t,n,r){h.beginPath(),h.arc(e,t,r,0,Math.PI*2),h.fillStyle=n,h.fill(),h.beginPath(),h.arc(e,t,r*.38,0,Math.PI*2),h.fillStyle=`rgba(255,255,255,0.5)`,h.fill()}function de(e,t,n){let r=e-f.x,i=t-f.y,a=Math.sqrt(r*r+i*i);h.save(),h.beginPath(),h.arc(f.x,f.y,a,0,Math.PI*2),h.strokeStyle=n+`30`,h.lineWidth=1.5,h.stroke(),h.restore()}function fe(e,t,n,r){h.save(),h.globalCompositeOperation=`lighter`;for(let i=0;i<3;i++){let a=Math.min(1,r+i*.1),o=14+a*44,s=Math.max(0,1-a*1.3);h.beginPath(),h.arc(e,t,o,0,Math.PI*2),h.strokeStyle=n,h.globalAlpha=s,h.lineWidth=Math.max(.1,2.5-a*2),h.stroke()}h.globalAlpha=1,h.restore()}var v=2.5,pe=.06,me=.12,he=.15,ge=300,_e=100,y=[],b=0,x=[],S=!1,C=0,w=0,T=0,E=0,D=0,O=!1,k=()=>{},A=()=>{},j=()=>{},M=()=>{},N=()=>{};function ve({onHit:e,onMiss:t,onScore:n,onEnd:r,onFail:i}){k=e||k,A=t||A,j=n||j,M=r||M,N=i||N}function ye(e){y=e.notes,e.notes.length}function be(){b=0,x=[],C=0,w=0,T=0,E=0,D=0,O=!1,S=!0}function xe(){return x}function P(){let e=E+D;return e===0?100:E/e*100}function Se(e){v=.5}function Ce(e){if(!S)return;let t=te(),n=null,r=1/0;for(let i of x){if(i.lane!==e||i.hit||i.missed)continue;let a=Math.abs(t-i.hitTime);a<me&&a<r&&(n=i,r=a)}if(n){n.hit=!0,n.hitWall=performance.now();let t=r<pe?`PERFECT`:`GOOD`,i=t===`PERFECT`?ge:_e;E++,w++,w>T&&(T=w);let a=Math.min(4,1+Math.floor(w/10));C+=i*a,k(e,t),j(C,w,P())}}function we(){if(!S)return;let e=te(),t=performance.now();for(;b<y.length;){v=1;let n=y[b];if(n.time-e<=v+.05)x.push({lane:n.lane,hitTime:n.time,spawnWall:t-(v-(n.time-e))*1e3,travelTime:v,hit:!1,missed:!1,hitWall:null,missWall:null}),b++;else break}for(let n of x)if(!n.hit&&!n.missed&&e>n.hitTime+he){n.missed=!0,n.missWall=t,D++,w=0,A(n.lane),j(C,w,P());let e=P();e<0&&!O&&(O=!0,S=!1,N(C,T,e))}x=x.filter(e=>e.hit?t-e.hitWall<400:e.missed?t-e.missWall<600:!0),b>=y.length&&x.length===0&&!O&&(S=!1,M(C,T,P()))}var Te=()=>{},F=()=>{},I=()=>{},L=()=>{},R=()=>{},z=()=>{};function Ee(e){Te=e.onLoadOsu||Te,F=e.onLoadAudio||F,I=e.onStart||I,L=e.onRetry||L,R=e.onOffset||R,z=e.onSpeed||z,Ne(),De(),Oe()}function De(){let e=K(`div`,`screen start-screen`,`start-screen`);e.innerHTML=`
    <h1>RHYTHM</h1>
    <div id="map-title">loading...</div>
    <div id="map-artist"></div>
    <div id="status-line">loading beatmap and audio...</div>
    <div class="row" style="margin-top:12px">
      <button id="btn-start" disabled>START</button>
    </div>
    <div class="offset-row">
      <span class="dim">OFFSET</span>
      <input type="range" id="offset-slider" min="-200" max="200" step="1" value="0">
      <span id="offset-val">0 ms</span>
    </div>
    <div class="offset-row">
  <span class="dim">SPEED</span>
  <input type="range" id="speed-slider" min="0.5" max="5.0" step="0.1" value="2.5">
  <span id="speed-val">2.5s</span>
</div>
    <div class="key-legend">A &nbsp;|&nbsp; S &nbsp;|&nbsp; D &nbsp;|&nbsp; J &nbsp;|&nbsp; K &nbsp;|&nbsp; L</div>
  `,document.getElementById(`app`).appendChild(e),document.getElementById(`btn-start`).addEventListener(`click`,I),document.getElementById(`offset-slider`).addEventListener(`input`,e=>{let t=parseInt(e.target.value);document.getElementById(`offset-val`).textContent=t+` ms`,R(t)}),document.getElementById(`speed-slider`).addEventListener(`input`,e=>{let t=parseFloat(e.target.value);document.getElementById(`speed-val`).textContent=t.toFixed(1)+`s`,z(t)})}function Oe(){let e=K(`div`,`hud hidden`,`hud`);e.innerHTML=`
    <div id="score">0</div>
    <div id="combo"></div>
    <div id="accuracy">100.0%</div>
    <div id="feedback"></div>
  `,document.getElementById(`app`).appendChild(e)}function ke(e,t,n,r){let i=document.getElementById(`results-screen`);i&&i.remove();let a=r===`WIN`?`#7cb4f5`:`#f57c7c`;i=K(`div`,`screen results-screen`,`results-screen`),i.innerHTML=`
    <h1 style="color: ${a}">${r}!</h1>
    <div id="map-title-result">${document.getElementById(`map-title`).textContent}</div>
    <div class="final-score">${e}</div>
    <div class="dim" style="letter-spacing:0.15em;font-size:11px">MAX COMBO ${t}</div>
    <div class="dim" style="letter-spacing:0.15em;font-size:11px;margin-top:4px">ACCURACY ${n.toFixed(1)}%</div>
    <button id="btn-retry" style="margin-top:20px">RETRY</button>
  `,document.getElementById(`app`).appendChild(i),document.getElementById(`btn-retry`).addEventListener(`click`,L)}var B=null;function Ae(e,t){document.getElementById(`map-title`).textContent=e||`untitled`,document.getElementById(`map-artist`).textContent=t||``}function V(e){document.getElementById(`status-line`).textContent=e}function H(e){document.getElementById(`btn-start`).disabled=!e}function U(e,t,n){document.getElementById(`score`).textContent=e;let r=document.getElementById(`combo`);if(r.textContent=t>=4?`× ${t} COMBO`:``,n!==void 0){let e=document.getElementById(`accuracy`);e.textContent=n.toFixed(1)+`%`,n<50?e.style.color=`#f57c7c`:n<75?e.style.color=`#f5e37c`:e.style.color=`#7cb4f5`}}function W(e){let t=document.getElementById(`feedback`),n={PERFECT:`#7cb4f5`,GOOD:`#f5e37c`,MISS:`#f57c7c`};t.textContent=e,t.style.color=n[e]||`black`,t.style.opacity=1,clearTimeout(B),B=setTimeout(()=>t.style.opacity=0,400)}function je(){document.getElementById(`start-screen`).classList.remove(`hidden`),document.getElementById(`hud`).classList.add(`hidden`);let e=document.getElementById(`results-screen`);e&&e.remove()}function Me(){document.getElementById(`start-screen`).classList.add(`hidden`),document.getElementById(`hud`).classList.remove(`hidden`),document.getElementById(`accuracy`).textContent=`100.0%`,document.getElementById(`accuracy`).style.color=`#7cb4f5`}function G(e,t,n,r){document.getElementById(`hud`).classList.add(`hidden`),ke(e,t,n,r)}function K(e,t,n){let r=document.createElement(e);return t&&(r.className=t),n&&(r.id=n),r}function Ne(){let e=document.createElement(`style`);e.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&display=swap');

    :root {
      --bg:      #ffffff;
      --accent:  #000000;
      --accent3: #000000;
      --red:     #000000;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      color: var(--accent);
      font-family: 'Share Tech Mono', monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #app {
      position: relative;
      width: 800px;
      height: 800px;
    }

    #game-canvas {
      position: absolute;
      inset: 0;
    }

    /* ── screens ── */
    .screen {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.92);
      z-index: 20;
      gap: 8px;
    }

    .screen h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 72px;
      letter-spacing: 0.2em;
      color: var(--accent);
      text-shadow: none;
      line-height: 1;
    }

    #map-title, #map-title-result {
      font-size: 13px;
      color: rgba(0,0,0,0.7);
      letter-spacing: 0.12em;
    }

    #map-artist {
      font-size: 11px;
      color: rgba(0,0,0,0.5);
      letter-spacing: 0.1em;
      min-height: 16px;
    }

    #status-line {
      font-size: 10px;
      color: rgba(0,0,0,0.4);
      letter-spacing: 0.1em;
      min-height: 14px;
    }

    .row {
      display: flex;
      gap: 10px;
    }

    button {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 0.2em;
      padding: 8px 28px;
      cursor: pointer;
      transition: background 0.12s, box-shadow 0.12s;
    }

    button:hover:not(:disabled) {
      background: var(--accent);
      color: var(--bg);
      box-shadow: 0 0 12px var(--accent);
    }

    button:disabled {
      opacity: 0.25;
      cursor: default;
    }

    .offset-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      font-size: 10px;
      letter-spacing: 0.1em;
    }

    .dim { color: rgba(0,0,0,0.5); }

    #offset-slider {
      -webkit-appearance: none;
      width: 140px;
      height: 2px;
      background: rgba(0,0,0,0.2);
      outline: none;
    }

    #speed-slider {
      -webkit-appearance: none;
      width: 140px;
      height: 2px;
      background: rgba(0,0,0,0.2);
      outline: none;
    }

    #offset-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }
    
    #speed-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }

    #offset-val { color: var(--accent); width: 44px; }

    #speed-val { color: var(--accent); width: 44px; }

    .key-legend {
      font-size: 11px;
      color: rgba(0,0,0,0.4);
      letter-spacing: 0.12em;
      margin-top: 4px;
    }

    /* ── HUD ── */
    .hud {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    }

    .hidden { display: none !important; }

    #score {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 52px;
      letter-spacing: 0.12em;
      color: black;
      text-shadow: none;
      line-height: 1;
    }

    #combo {
      font-size: 12px;
      color: var(--accent3);
      letter-spacing: 0.2em;
      min-height: 18px;
      margin-top: 4px;
    }

    #accuracy {
      font-size: 11px;
      letter-spacing: 0.15em;
      min-height: 16px;
      margin-top: 2px;
      font-weight: bold;
    }

    #feedback {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 30px;
      letter-spacing: 0.15em;
      min-height: 38px;
      margin-top: 4px;
      transition: opacity 0.15s;
    }

    .final-score {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 80px;
      color: var(--accent);
      text-shadow: none;
      letter-spacing: 0.1em;
      line-height: 1;
    }
  `,document.head.appendChild(e)}var Pe=3,Fe=1,Ie=0,Le=12,Re=14,ze=13,q={[Pe]:0,[Fe]:1,[Ie]:2,[Le]:5,[Re]:4,[ze]:3},J={};function Be(){let e=navigator.getGamepads();for(let t=0;t<e.length;t++)e[t]&&(J[t]=Array(e[t].buttons.length).fill(!1))}function Ve(e,t){let n=navigator.getGamepads();for(let r=0;r<n.length;r++){let i=n[r];if(i){J[r]||(J[r]=Array(i.buttons.length).fill(!1));for(let[n,a]of Object.entries(q)){let o=i.buttons[n]?.pressed||!1,s=J[r][n]||!1;o&&!s&&e(a),!o&&s&&t(a),J[r][n]=o}}}}function He(){let e=new Set,t=navigator.getGamepads();for(let n=0;n<t.length;n++){let r=t[n];if(r)for(let[t,n]of Object.entries(q))r.buttons[t]?.pressed&&e.add(parseInt(n))}return e}window.addEventListener(`gamepadconnected`,e=>{console.log(`Gamepad connected:`,e.gamepad.id),Be()}),window.addEventListener(`gamepaddisconnected`,e=>{console.log(`Gamepad disconnected:`,e.gamepad.id),delete J[e.gamepad.index]});var{ipcRenderer:Ue}=window.require(`electron`),Y=new Set,We=[`j`,`k`,`l`,`d`,`s`,`a`],X=!1,Z=!1;ae(),Be(),ve({onHit:(e,t)=>W(t),onMiss:()=>W(`MISS`),onScore:(e,t,n)=>U(e,t,n),onEnd:(e,t,n)=>G(e,t,n,`WIN`),onFail:(e,t,n)=>G(e,t,n,`FAILED`)}),Ee({onLoadOsu:Q,onLoadAudio:$,onStart:qe,onRetry:Je,onOffset:e=>ne(e),onSpeed:e=>Se(e)});async function Ge(){s();let e=[`/hitsounds/lane0.wav`,`/hitsounds/lane1.wav`,`/hitsounds/lane2.wav`,`/hitsounds/lane3.wav`,`/hitsounds/lane4.wav`,`/hitsounds/lane5.wav`];for(let t=0;t<e.length;t++)try{let n=await(await fetch(e[t])).arrayBuffer();await l(t,n),console.log(`Loaded hit sound for lane ${t}`)}catch{console.log(`No custom hit sound for lane ${t}, will use default beep`)}}Ge(),Q(),$();async function Q(){try{V(`loading beatmap...`);let t=e(await(await fetch(`assets/gamedata/natalia.osu`)).text());if(t.notes.length===0){V(`no hit objects found`);return}ye(t),Ae(t.title,t.artist),V(t.notes.length+` notes loaded`),X=!0,Ke()}catch(e){V(`error loading beatmap: `+e.message)}}async function $(){try{s(),V(`loading audio...`);let e=await(await fetch(`assets/gamedata/natalia.mp3`)).arrayBuffer();V(`decoding...`),await c(e),V(`audio ready`),Z=!0,Ke()}catch(e){V(`error loading audio: `+e.message)}}function Ke(){H(X&&Z)}function qe(){Me(),U(0,0,100),u(),be()}function Je(){ee(),je(),X=!1,Z=!1,V(``),H(!1),Q(),$()}document.addEventListener(`keydown`,e=>{if(e.repeat)return;let t=We.indexOf(e.key.toLowerCase());t!==-1&&(Y.add(t),d(t),Ce(t))}),document.addEventListener(`keyup`,e=>{let t=We.indexOf(e.key.toLowerCase());t!==-1&&Y.delete(t)});function Ye(){Ve(e=>{d(e),Ce(e)},e=>{}),we();let e=performance.now();oe(),se(),le(new Set([...Y,...He()]));for(let t of xe())ue(t,e);requestAnimationFrame(Ye)}Ye();