"""Convert the checked-in design export to ordinary React components. No runtime eval."""
from html.parser import HTMLParser
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
q=lambda v:json.dumps(v,ensure_ascii=False)
void=set('input img br hr meta link area base col embed param source track wbr'.split())
class Parser(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.tree=['root',{},[]]; self.stack=[self.tree]
 def handle_starttag(self,t,a):
  n=[t,dict(a),[]]; self.stack[-1][2].append(n)
  if t not in void:self.stack.append(n)
 def handle_startendtag(self,t,a): self.handle_starttag(t,a); self.handle_endtag(t) if t not in void else None
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i][0]==t:self.stack=self.stack[:i];break
 def handle_data(self,s): self.stack[-1][2].append(s)
def expr(s):
 if s is None:return 'true'
 parts=re.split(r'{{(.*?)}}',s)
 if len(parts)==3 and not parts[0] and not parts[2]:return parts[1].strip()
 return ' + '.join(('String('+p.strip()+" ?? '')") if i%2 else q(p) for i,p in enumerate(parts) if p) or '""'
alias={'class':'className','for':'htmlFor','tabindex':'tabIndex','readonly':'readOnly','autofocus':'autoFocus','autocomplete':'autoComplete','colspan':'colSpan','rowspan':'rowSpan','maxlength':'maxLength','minlength':'minLength','viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio','refx':'refX','refy':'refY','markerunits':'markerUnits','markerwidth':'markerWidth','markerheight':'markerHeight'}
def add_class(a, value):
 a['class'] = (a.get('class','')+' '+value).strip()
def walk(n, screen, parent=None):
 if isinstance(n,str):return
 t,a,children=n
 style=a.get('style','')
 if t=='div' and a.get('class')=='g':
  a['data-screen']=screen
  add_class(a,'screen-root')
 if t=='main':
  add_class(a,'page-content');a['id']='main-content';a['tabindex']='-1'
  if parent and any(isinstance(c,list) and 'SideNav' in str(c) for c in parent[2]):add_class(parent[1],'shell-body')
 if t=='dc-import' and a.get('name')=='SideNav':
  a['on-close']='{{closeMenu}}'
  if parent:add_class(parent[1],'shell-sidebar')
 if t=='dc-import' and a.get('name')=='TopBar':
  a['menu-open']='{{menuOpen}}'
  if parent:add_class(parent[1],'shell-header')
 if screen=='B1-Overview' and t=='span' and a.get('style')=='{{n.pos}}':
  n[2][:]=[['ServiceName',{'name':'{{n.label}}'},[]]]
 if t=='h1':add_class(a,'page-title')
 if t=='h2':add_class(a,'section-title')
 if t in ['section','aside'] and 'border: 1px' in style:
  add_class(a,'panel')
  if re.search(r'(?:^|;)\s*padding:',style):add_class(a,'panel-padded')
 if a.get('role')=='status' and 'position: fixed' in style:add_class(a,'ui-toast')
 if a.get('role')=='tablist':add_class(a,'tabs')
 if a.get('role')=='radiogroup':add_class(a,'segmented-control')
 if t=='input' and a.get('placeholder') and not a.get('aria-label'):
  a['aria-label']=a['placeholder']
 if t=='button' and a.get('onclick') in ['{{copy}}','{{copyKey}}']:n[0]='AsyncButton'
 if t=='button' and a.get('type')!='submit' and 'onclick' not in a and 'disabled' not in a:n[0]='PreviewAction'
 if t=='a' and screen=='A1-Login' and any('로 로그인' in c for c in children if isinstance(c,str)):
  n[0]='PreviewAction';a.pop('href',None)
 if t=='table':add_class(a,'data-table')
 if 'overflow-x: auto' in style:
  add_class(a,'scroll-region');a['tabindex']='0'
 if t in ['div','a'] and 'aspect-ratio:' in style:
  add_class(a,'mini-map' if screen=='B1-Overview' and t=='a' else 'graph-canvas')
 if t=='div' and 'position: relative' in style and 'height: 16px' in style:add_class(a,'chart-ticks')
 if t=='section' and a.get('aria-label')=='주요 지표':add_class(a,'kpi-strip')
 if t=='section' and a.get('aria-labelledby')=='st-h':
  content=[c for c in children if isinstance(c,list)]
  n[2][:]=[content[0],['DataViewport',{'label':'서비스 타임라인'},[['div',{'class':'timeline-canvas'},content[1:]]]]]
 for c in children:walk(c,screen,n)
 # Convert existing backdrop/dialog pairs to the same accessible native dialog.
 if 'position: fixed' in style and 'var(--overlay)' in style:
  dialog=next((c for c in children if isinstance(c,list) and c[1].get('role')=='dialog'),None)
  if dialog:
   def nodes(tree):
    if isinstance(tree,list):
     yield tree
     for ch in tree[2]:yield from nodes(ch)
   heading=next((c for c in nodes(dialog) if c[0]=='h2'),None)
   cancel=next((c for c in nodes(dialog) if c[0]=='button' and '취소' in str(c[2])),None)
   if heading and cancel:
    title=''.join(c for c in heading[2] if isinstance(c,str));heading[0]='span';heading[1]={'hidden':None}
    n[:]=['Dialog',{'title':title,'onClose':cancel[1]['onclick']},dialog[2]]

def render(n):
 if isinstance(n,str):return expr(n) if n.strip() else 'null'
 t,a,children=n
 t={'scorehelp':'ScoreHelp','impactsummary':'ImpactSummary'}.get(t,t)
 if t=='select':
  for c in children:
   if isinstance(c,list) and c[0]=='option' and 'selected' in c[1]:
    a['value']=c[1].get('value',''.join(x for x in c[2] if isinstance(x,str))); del c[1]['selected']
 kids=', '.join(render(c) for c in children)
 if t=='helmet':return 'null'
 if t=='sc-if':return '('+expr(a['value'])+' ? React.createElement(React.Fragment,null,'+kids+') : null)'
 if t=='sc-for':return '('+expr(a['list'])+' ?? []).map(('+a['as']+', index) => React.createElement(React.Fragment,{key:index},'+kids+'))'
 props=[]
 for k,v in a.items():
  if k.startswith('hint-') or (t=='dc-import' and k=='name'):continue
  name=alias.get(k,k)
  if k.startswith('on'):
   name=next((x for x in ['onClose','onClick','onChange','onInput','onSubmit','onMouseEnter','onMouseLeave','onFocus','onBlur','onKeyDown','onTheme','onMenu'] if x.lower()==k.replace('-','').lower()),k)
  elif '-' in k and not k.startswith(('aria-','data-')):name=re.sub(r'-([a-z])',lambda m:m[1].upper(),k)
  val=expr(v)
  if k=='style':val='css('+val+')'
  if k=='href':val='routeHref('+val+')'
  if k in ['disabled','checked','selected','multiple','required']:val='Boolean('+val+')'
  if k=='value' and not any(x in a for x in ['onchange','oninput']):name='defaultValue'
  if k=='checked' and not any(x in a for x in ['onchange','onclick']):name='defaultChecked'
  props.append(q(name)+':'+val)
 tag=a['name'] if t=='dc-import' else (t if t in ['Dialog','PreviewAction','DataViewport','AsyncButton','ServiceName','ScoreHelp','ImpactSummary'] else q(t))
 result = 'React.createElement('+tag+', {'+', '.join(props)+'}'+(', '+kids if kids else '')+')'
 if t=='table' or 'graph-canvas' in a.get('class',''):
  result='React.createElement(DataViewport, {label: '+q('표' if t=='table' else '서비스 맵')+'}, '+result+')'
 return result
files=sorted(f for f in (root/'design/screens').glob('*.html') if f.stem.replace('.dc','') not in ['TopBar','SideNav','TimePicker'])
names={f.stem.replace('.dc',''):re.sub(r'[^a-zA-Z]','',f.stem.replace('.dc','')) for f in files}
out=["import { ScoreHelp, ImpactSummary } from './components/InvestigationHelp.jsx';", "import { logRows } from './logs.js';", "import { incidentRows, incidentHref, readListState, logHref } from './incidents.js';", "import React from 'react';", "import { css, routeHref } from './styles.js';", "import { TopBar, SideNav } from './components/navigation.jsx';", "import { TimePicker } from './components/TimePicker.jsx';", "import { Dialog, DataViewport, AsyncButton, ServiceName } from './components/controls.jsx';", "import { PreviewAction } from './components/PreviewAction.jsx';"]
styles=[]
for f in files:
 s=f.read_text(); markup=re.search(r'<x-dc>(.*?)</x-dc>',s,re.S)[1]; p=Parser();p.feed(markup)
 for node in p.tree[2]:walk(node,f.stem.replace('.dc',''))
 script=re.search(r'<script type="text/x-dc".*?>(.*?)</script>',s,re.S)[1]
 config=json.loads(re.search(r"data-props='(.*?)'",s,re.S)[1]); defaults={k:v['default'] for k,v in config.items() if isinstance(v,dict) and 'default' in v}
 name=names[f.stem.replace('.dc','')]; script=script.replace('class Component extends DCLogic','class '+name+' extends React.Component')
 variables=sorted({x.split('.')[0].strip() for x in re.findall(r'{{(.*?)}}',markup) if re.match(r'^\w',x.strip())}-{a for a in re.findall(r'as="(.*?)"',markup)}-{'true','false'})
 script=script.replace('extends React.Component {', 'extends React.Component { componentDidMount() { if (this.state && Object.hasOwn(this.state, \"menu\") && window.matchMedia(\"(max-width: 1023px)\").matches) this.setState({menu:false}); }', 1)
 script=script.rstrip();script=script[:-1]+ '\nrender() { const {'+', '.join(variables)+'} = this.renderVals(); const closeMenu = () => this.setState({menu:false}); return React.createElement(React.Fragment,null,'+', '.join(render(c) for c in p.tree[2])+'); }\n}'
 out.extend([script,name+'.defaultProps = '+q(defaults)+';'])
 styles.extend(re.findall(r'<style>(.*?)</style>',markup,re.S))
out.append('export const screens = {'+', '.join(q(k)+':'+v for k,v in names.items())+'};')
(root/'src/screens.jsx').write_text('\n'.join(out))
(root/'src/design.css').write_text('\n'.join(dict.fromkeys(styles)))
print('Converted',len(files),'screens and components')
