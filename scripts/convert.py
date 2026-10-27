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
alias={'class':'className','for':'htmlFor','tabindex':'tabIndex','readonly':'readOnly','autofocus':'autoFocus','autocomplete':'autoComplete','colspan':'colSpan','rowspan':'rowSpan','maxlength':'maxLength','viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio','refx':'refX','refy':'refY','markerunits':'markerUnits','markerwidth':'markerWidth','markerheight':'markerHeight'}
def render(n):
 if isinstance(n,str):return expr(n) if n.strip() else 'null'
 t,a,children=n
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
   name=next((x for x in ['onClick','onChange','onInput','onSubmit','onMouseEnter','onMouseLeave','onFocus','onBlur','onKeyDown','onTheme','onMenu'] if x.lower()==k.replace('-','').lower()),k)
  elif '-' in k and not k.startswith(('aria-','data-')):name=re.sub(r'-([a-z])',lambda m:m[1].upper(),k)
  val=expr(v)
  if k=='style':val='css('+val+')'
  if k in ['disabled','checked','selected','multiple','required']:val='Boolean('+val+')'
  if k=='value' and not any(x in a for x in ['onchange','oninput']):name='defaultValue'
  if k=='checked' and not any(x in a for x in ['onchange','onclick']):name='defaultChecked'
  props.append(q(name)+':'+val)
 tag=a['name'] if t=='dc-import' else q(t)
 return 'React.createElement('+tag+', {'+', '.join(props)+'}'+(', '+kids if kids else '')+')'
files=list((root/'design/screens').glob('*.html'))
names={f.stem.replace('.dc',''):re.sub(r'[^a-zA-Z]','',f.stem.replace('.dc','')) for f in files}
out=["import React from 'react';", "import { css } from './styles.js';"]
styles=[]
for f in files:
 s=f.read_text(); markup=re.search(r'<x-dc>(.*?)</x-dc>',s,re.S)[1]; p=Parser();p.feed(markup)
 script=re.search(r'<script type="text/x-dc".*?>(.*?)</script>',s,re.S)[1]
 config=json.loads(re.search(r"data-props='(.*?)'",s,re.S)[1]); defaults={k:v['default'] for k,v in config.items() if isinstance(v,dict) and 'default' in v}
 name=names[f.stem.replace('.dc','')]; script=script.replace('class Component extends DCLogic','class '+name+' extends React.Component')
 variables=sorted({x.split('.')[0].strip() for x in re.findall(r'{{(.*?)}}',markup) if re.match(r'^\w',x.strip())}-{a for a in re.findall(r'as="(.*?)"',markup)}-{'true','false'})
 script=script.replace('extends React.Component {', 'extends React.Component { componentDidMount() { if (this.state && Object.hasOwn(this.state, \"menu\") && window.matchMedia(\"(max-width: 600px)\").matches) this.setState({menu:false}); }', 1)
 script=script.rstrip();script=script[:-1]+ '\nrender() { const {'+', '.join(variables)+'} = this.renderVals(); return React.createElement(React.Fragment,null,'+', '.join(render(c) for c in p.tree[2])+'); }\n}'
 out.extend([script,name+'.defaultProps = '+q(defaults)+';'])
 styles.extend(re.findall(r'<style>(.*?)</style>',markup,re.S))
out.append('export const screens = {'+', '.join(q(k)+':'+v for k,v in names.items())+'};')
(root/'src/screens.jsx').write_text('\n'.join(out))
(root/'src/design.css').write_text('\n'.join(dict.fromkeys(styles)))
print('Converted',len(files),'screens and components')
