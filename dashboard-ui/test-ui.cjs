const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const requireDeps=require;
const {JSDOM,VirtualConsole}=requireDeps('jsdom');
const dir=path.resolve(__dirname,'../dist/license/dashboard');requireDeps('css-tree').parse(fs.readFileSync(path.join(dir,'workspace.css'),'utf8'));
const errors=[],console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM('<!doctype html><body><div id="fixtures"></div></body>',{url:'https://novaclient.tech/license/dashboard/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console}),w=dom.window,d=w.document;
w.eval(fs.readFileSync(path.join(dir,'react-vibe-ui.js'),'utf8'));
function add(type,props){const el=d.createElement('div');el.dataset.vibeComponent=type;el.dataset.vibeProps=JSON.stringify(props);d.getElementById('fixtures').append(el);return el;}
(async()=>{
const trend=add('trend',{points:[{time:1,value:3,secondary:2,label:'First',short:'May 1'},{time:3601,value:7,secondary:4,label:'Last',short:'May 2'}]});
const bars=add('bars',{points:[{label:'May',value:5,secondary:3}],series:['Created','Activated']});
const dist=add('distribution',{groups:[{label:'<img src=x onerror=alert(1)>',count:4},{label:'Unused',count:1}],total:5});
const zero=add('distribution',{groups:[{label:'No records',count:0}],total:0});
const flow=add('flow',{clients:0});
await new Promise(r=>setTimeout(r,250));
assert.ok(trend.querySelector('svg'));assert.ok(bars.querySelector('.rv-bar-pair'));assert.equal(dist.querySelector('img'),null);assert.ok(dist.textContent.includes('<img'));assert.ok(flow.textContent.includes('not measured traffic'));assert.ok(!zero.innerHTML.includes('NaN'));assert.ok(!dist.innerHTML.includes('NaN'));
bars.querySelector('button').focus();await new Promise(r=>setTimeout(r,30));assert.ok(bars.querySelector('.rv-chart-tooltip'));d.getElementById('fixtures').replaceChildren();await new Promise(r=>setTimeout(r,50));assert.equal(d.querySelectorAll('[data-vibe-component]').length,0);assert.deepEqual(errors,[]);w.dispatchEvent(new w.Event('pagehide'));dom.window.close();process.stdout.write('PASS React chart mounting, keyboard tooltip, zero totals, escaping, network labels, host cleanup, CSS syntax\n');
})().catch(error=>{process.stderr.write(error.stack);w.dispatchEvent(new w.Event('pagehide'));dom.window.close();process.exitCode=1});
