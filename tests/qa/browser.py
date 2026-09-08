"""UI in Chromium memory + explicit HTTP bridge to the real local server.
Enterprise navigation policy is preserved. This is NOT native browser-cookie/OAuth QA.
Run a fresh mock server first, then: python tests/qa/browser.py [base_url].
QA dependencies (Python/Playwright/requests) are not runtime dependencies.
"""
import sys,json,base64,re,time
from pathlib import Path
import requests
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4180'
OUT=ROOT/'docs/qa';(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
session=requests.Session();errors=[];checks=[];calls=[]
def check(label,condition=True):
 if not condition:raise AssertionError(label)
 checks.append(label)
def bridge(source,path,opts):
 assert path.startswith('/api/'),path
 headers=opts.get('headers',{}).copy();headers['Origin']=BASE
 r=session.request(opts.get('method','GET'),BASE+path,headers=headers,data=opts.get('body'),timeout=25,allow_redirects=False)
 calls.append({'path':path,'status':r.status_code,'method':opts.get('method','GET')})
 return {'status':r.status_code,'text':r.text}
assets={}
for path in (ROOT/'public/assets').rglob('*'):
 if path.suffix in ['.svg','.png','.webp']:
  mime={'.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.suffix]
  assets['/assets/'+path.relative_to(ROOT/'public/assets').as_posix()]='data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
html=(ROOT/'public/index.html').read_text();html=re.sub(r'<link[^>]+>','',html);html=re.sub(r'<script[^>]*>.*?</script>','',html,flags=re.S)
html=html.replace('</head>','<style>'+(ROOT/'public/styles.css').read_text()+'</style></head>')
bootstrap="""
window.fetch=async(path,opts={})=>{const r=await window.qaHTTP(path,opts);return new Response(r.text,{status:r.status,headers:{'Content-Type':'application/json'}});};
const images=IMAGE_MAP;
function localImages(){document.querySelectorAll('img[src^="/assets/"]').forEach(img=>{if(images[img.getAttribute('src')])img.src=images[img.getAttribute('src')];});}
new MutationObserver(localImages).observe(document,{childList:true,subtree:true});localImages();
""".replace('IMAGE_MAP',json.dumps(assets))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1050},accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.expose_binding('qaHTTP',bridge)
 page.set_content(html);page.add_script_tag(content=bootstrap);page.add_script_tag(content=(OUT/'browser-bundle.js').read_text())
 def wait():page.wait_for_timeout(250)
 def route(path):page.evaluate('(path)=>{location.hash=path}',path);wait();page.wait_for_timeout(200)
 def click(action,id=None):
  selector=f'[data-action="{action}"]'+(f'[data-id="{id}"]' if id else '')
  page.locator(selector).filter(visible=True).first.click();wait()
 def accept_terms():
  expect(page.locator('dialog')).to_be_visible();page.locator('form[data-form="terms"] input').check();page.locator('form[data-form="terms"] button[type="submit"]').click();expect(page.locator('dialog')).not_to_be_visible();wait()
 def switch(slug):
  click('demo');click('demo-user','demo_'+slug)
  if page.locator('form[data-form="terms"]').count():accept_terms()
 def order_action(action):
  click(action);page.locator('form[data-form="order-action"] button[type="submit"]').click();wait()
 try:
  expect(page.locator('h1')).to_contain_text('Conectá',timeout=10000);check('home load')
  page.wait_for_timeout(800);page.screenshot(path=str(OUT/'screenshots/home-desktop.png'),full_page=True)
  click('demo-user','demo_mateo');accept_terms();expect(page.locator('h1')).to_have_text('Tu espacio de prestador.');check('server consent gate')
  click('mp-connect');expect(page.get_by_text('Vinculada',exact=True)).to_be_visible();check('mock seller connection')
  route('/publicar');page.locator('[name="title"]').fill('Asistencia remota v5 de prueba');page.locator('textarea[name="description"]').fill('Una sesión de soporte para adultos. Incluye explicación y revisión de una tarea digital.');page.locator('input[name="priceArs"][value="5000"]').check();page.locator('[name="blocks"]').fill('4');page.locator('[name="sellerFeeAccepted"]').check();check('gross preview', '$20.000' in re.sub(r'\s+','',page.locator('#price-preview').inner_text()));page.screenshot(path=str(OUT/'screenshots/publicar-desktop.png'),full_page=True)
  page.locator('form[data-form="publish"] button[type="submit"]').click();expect(page.locator('h1')).to_have_text('Tu espacio de prestador.');check('publish with tier and explicit fee')
  switch('ana');route('/explorar');page.locator('input[name="q"]').fill('Tu compu');page.locator('form[data-form="filters"] button[type="submit"]').click();wait();expect(page.locator('.offer-card')).to_have_count(1);check('filter');click('quick','demo_offer_1');click('book','demo_offer_1');page.locator('form[data-form="book"] input[name="blocks"]').fill('4');page.locator('form[data-form="book"] textarea').fill('Necesito una explicación de herramientas de oficina.');page.locator('form[data-form="book"] input[type=checkbox]').check();page.locator('form[data-form="book"] button[type=submit]').click();wait();expect(page.locator('h1')).to_have_text('Todo sobre tu servicio.');bid=page.evaluate('location.hash').split('/')[-1];check('server-created order')
  check('frozen quote displayed','$10.000' in re.sub(r'\s+','',page.locator('main').inner_text()));page.screenshot(path=str(OUT/'screenshots/orden-solicitada.png'),full_page=True)
  switch('mateo');route('/orden/'+bid);order_action('accept');check('provider accepts');switch('ana');route('/orden/'+bid);click('checkout');expect(page.locator('form[data-form="checkout"]')).to_be_visible();page.locator('form[data-form="checkout"] input').check();page.locator('form[data-form="checkout"] button[type=submit]').click();expect(page.get_by_text('Simulador de Mercado Pago',exact=True)).to_be_visible();page.screenshot(path=str(OUT/'screenshots/checkout.png'),full_page=True)
  page.locator('[data-action="simulate"][data-status="approved"]').click();wait();expect(page.locator('h1')).to_have_text('Todo sobre tu servicio.');check('verified mock payment');check('release pending visible','Pendiente' in page.locator('main').inner_text())
  page.locator('form[data-form="chat"] textarea').fill('<img src=x onerror=alert(1)> Hola, coordinemos.');page.locator('form[data-form="chat"] button[type=submit]').click();wait();check('chat escapes HTML', page.locator('.messages img').count()==0);check('chat stored', '<img' in page.locator('.messages').inner_text())
  switch('mateo');route('/orden/'+bid);order_action('start');order_action('complete');switch('ana');route('/orden/'+bid);order_action('confirm');check('service completed without moving funds');click('review');page.locator('form[data-form="review"] textarea').fill('Todo claro en esta prueba.');page.locator('form[data-form="review"] button[type=submit]').click();wait();check('blind review own-only message','Solo vos podés ver' in page.locator('main').inner_text());page.screenshot(path=str(OUT/'screenshots/orden-completa.png'),full_page=True)
  switch('mateo');route('/orden/'+bid);check('other review hidden','Todo claro en esta prueba.' not in page.locator('main').inner_text());click('review');page.locator('form[data-form="review"] textarea').fill('Buena comunicación.');page.locator('form[data-form="review"] button[type=submit]').click();wait();check('bilateral reveal','Todo claro en esta prueba.' in page.locator('main').inner_text())
  route('/movimientos');expect(page.locator('h1')).to_have_text('Tus pagos. Tus cobros.');check('payment records');page.screenshot(path=str(OUT/'screenshots/pagos-desktop.png'),full_page=True)
  route('/explorar');click('clear-filters');click('favorite','demo_offer_1');check('favorite response');click('compare','demo_offer_1');click('compare','demo_offer_2');click('compare-open');expect(page.get_by_text('Compará antes de elegir.',exact=True)).to_be_visible();check('comparison');page.keyboard.press('Escape');wait();click('compare-clear');
  page.keyboard.press('Control+k');page.locator('#quick-search').fill('Agenda');check('quick search', page.locator('#quick-results a').count()>0);page.keyboard.press('Escape');
  routes=['/','/explorar','/necesidades','/publicar','/oferta/demo_offer_1','/ordenes','/orden/'+bid,'/agenda','/movimientos','/prestador','/perfil','/condiciones','/ayuda','/acceso','/registro']
  overflow=[]
  for theme in ['light','dark']:
   page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   # The renderer re-applies saved appearance, so use its actual control as well.
   click('settings');click('set-theme',theme);click('close-modal')
   for width in [320,390,768,1024,1440]:
    page.set_viewport_size({'width':width,'height':950})
    for path in routes:
     route(path);delta=page.evaluate('document.documentElement.scrollWidth-innerWidth')
     check(f'layout {path} {width} {theme}',delta<=1)
    if width==390:
     route('/');page.screenshot(path=str(OUT/f'screenshots/home-mobile-{theme}.png'),full_page=True)
     route('/orden/'+bid);page.screenshot(path=str(OUT/f'screenshots/order-mobile-{theme}.png'),full_page=True)
  check('no page JS errors',not errors)
  print(json.dumps({'checks':len(checks),'errors':errors,'requests':len(calls),'order':bid},indent=2))
 except Exception as e:
  page.screenshot(path=str(OUT/'screenshots/failure.png'),full_page=True)
  (OUT/'browser-failure.txt').write_text(str(e)+'\n'+page.locator('body').inner_text()[:9000]+'\nJS: '+repr(errors))
  print('FAIL',e);raise
 finally:
  (OUT/'browser-report.json').write_text(json.dumps({'checks':checks,'errors':errors,'requests':calls,'method':'Chromium page.set_content + explicit Python HTTP bridge; no native browser navigation/cookie/OAuth coverage'},ensure_ascii=False,indent=2));browser.close()
