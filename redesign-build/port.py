import re,sys
src=open(sys.argv[1],encoding="utf-8").read()
font="@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap');"
style=re.search(r'<style>(.*?)</style>',src,re.S).group(1)
# scope reset to .aa-rd
style=style.replace('*{margin:0;padding:0;box-sizing:border-box}','.aa-rd *{margin:0;padding:0;box-sizing:border-box}')
style=re.sub(r'(^|\n)\s*body\{', r'\n.aa-rd{', style)
style=style.replace('a{text-decoration:none;color:inherit}','.aa-rd a{text-decoration:none;color:inherit}')
style=style.replace('::selection','.aa-rd ::selection')
style=style.replace('html{scroll-behavior:smooth}','')
inner=re.search(r'<x-dc>(.*?)</x-dc>',src,re.S).group(1)
inner=re.sub(r'<helmet>.*?</helmet>','',inner,flags=re.S)
inner=re.sub(r'<sc-if[^>]*>','',inner); inner=inner.replace('</sc-if>','')
inner=re.sub(r'\{\{.*?\}\}','',inner)
# logo imgs -> text wordmark
inner=re.sub(r'<img src="assets/logo-agile-agilist\.png"[^>]*filter:brightness\(0\) invert\(1\)[^>]*>',
  '<span style="font-weight:800;font-size:20px;letter-spacing:.02em;line-height:1;color:#fff;white-space:nowrap">AGILE<span style="color:#8FCFCF">AGILIST</span></span>',inner)
inner=re.sub(r'<img src="assets/logo-agile-agilist\.png"[^>]*>',
  '<span style="font-weight:800;font-size:19px;letter-spacing:.02em;line-height:1;color:#0E3A44;white-space:nowrap">AGILE<span style="color:#127E88">AGILIST</span></span>',inner)
# drop style-hover attrs
inner=re.sub(r'\s+style-hover="[^"]*"','',inner)
# add class aa-rd to first top-level div
inner=inner.strip()
inner=re.sub(r'^<div ', '<div class="aa-rd" ', inner, count=1)
out="<!-- wp:html -->\n<style>\n  "+font+"\n"+style.strip()+"\n</style>\n"+inner+"\n<!-- /wp:html -->"
open(sys.argv[2],"w",encoding="utf-8").write(out)
print("wrote",sys.argv[2],"len",len(out),"| logo refs left:",out.count("assets/"),"| style-hover left:",out.count("style-hover"))
