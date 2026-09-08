"""Run against a freshly extracted repository with its server in MOCK.
Native HTTP requests/cookies; no browser, no live PSP, no actual charge.
python tests/qa/package-smoke.py http://127.0.0.1:4190
"""
import sys,uuid,json
import requests
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4190'
checks=[]
def check(label,ok):
 assert ok,label
 checks.append(label)
class Client:
 def __init__(self): self.http=requests.Session();self.csrf=''
 def get(self,p):
  r=self.http.get(base+'/api'+p,timeout=15);assert r.status_code==200,(p,r.status_code,r.text);return r.json()
 def post(self,p,data=None,extra=None):
  r=self.http.post(base+'/api'+p,json=data or {},headers={'Origin':base,'X-CSRF-Token':self.csrf,**(extra or {})},timeout=15)
  assert r.status_code<300,(p,r.status_code,r.text)
  return r.json()
 def login_demo(self,id):
  self.post('/demo/login',{'userId':id});self.csrf=self.get('/session')['csrf'];legal=self.get('/legal');self.post('/terms/accept',{'accept':True,'version':legal['version'],'hash':legal['hash']});return legal
seller=Client();buyer=Client();legal=seller.login_demo('demo_mateo');seller.post('/mp/connect');buyer.login_demo('demo_ana')
check('ambientes y cookies separadas',seller.get('/session')['user']['id']=='demo_mateo' and buyer.get('/session')['user']['id']=='demo_ana')
from datetime import datetime,timedelta,timezone
when=(datetime.now(timezone.utc)+timedelta(days=2)).isoformat()
body={'offerId':'demo_offer_1','blocks':4,'expectedPriceArs':2500,'scheduledAt':when,'notes':'Prueba del paquete descomprimido, sin dinero real.','quoteAccepted':True,'termsHash':legal['hash']};key=str(uuid.uuid4());b=buyer.post('/bookings',body,{'Idempotency-Key':key});bid=b['id'];check('precio y comisión congelados',b['gross_cents']==1000000 and b['commission_cents']==50000)
check('idempotencia nativa HTTP',buyer.post('/bookings',body,{'Idempotency-Key':key})['id']==bid)
seller.post('/bookings/'+bid+'/accept');buyer.post('/bookings/'+bid+'/checkout',{'accept':True,'termsHash':legal['hash']});buyer.post('/demo/pay/'+bid,{'status':'approved'})
paid=buyer.get('/bookings/'+bid);check('pago verificado por servidor mock',paid['booking']['payment_status']=='APPROVED')
entries=len(buyer.get('/finances')['entries']);seller.post('/bookings/'+bid+'/start');seller.post('/bookings/'+bid+'/messages',{'body':'Mensaje de prueba con texto <script>sin ejecución</script>'});seller.post('/bookings/'+bid+'/complete');buyer.post('/bookings/'+bid+'/confirm');check('finalizar no genera transferencia adicional',len(buyer.get('/finances')['entries'])==entries)
buyer.post('/bookings/'+bid+'/reviews',{'rating':5,'comment':'Valoración de prueba privada'});check('review ciega aplicada en servidor',not seller.get('/bookings/'+bid)['reviews']);seller.post('/bookings/'+bid+'/reviews',{'rating':5,'comment':'Prueba finalizada'});check('review bilateral revelada',len(buyer.get('/bookings/'+bid)['reviews'])==2)
check('sin secretos en export propio','encrypted_tokens' not in json.dumps(buyer.get('/export')))
for path in ['/server/config.mjs','/.env','/data/intera-mock.sqlite']:
 check('privado '+path,requests.get(base+path,timeout=5).status_code==404)
check('HTML servido por el paquete',requests.get(base,timeout=5).status_code==200)
print(json.dumps({'checks':checks,'count':len(checks),'order':bid,'base':base,'mode':'mock'},ensure_ascii=False,indent=2))
