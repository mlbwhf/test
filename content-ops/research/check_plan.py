# Usage: python3 check_plan.py <list_pages edit-context JSON dump> — shows which planned edits are still pending
import json,sys
plan=json.load(open(__file__.replace('check_plan.py','chatgpt-1b-edit-plan.json')))['edits']
ps={p['id']:p for p in json.load(open(sys.argv[1]))}
pend=[]
for n,(i,f,s,r) in enumerate(plan):
    if i not in ps: print(n,i,'NOT FETCHED'); continue
    t=ps[i]['content']['raw'] if f=='c' else ps[i]['excerpt']['raw']
    cs,cr=t.count(s),t.count(r)
    st='DONE' if cs==0 and cr>0 else ('PENDING x%d'%cs if cs>0 else 'MISSING(search and replace both absent)')
    if st!='DONE': pend.append(n)
    print(n,i,f,st)
print('pending:',pend)
