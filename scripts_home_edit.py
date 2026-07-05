import json,sys,re
src=open('/home/user/test/backups/961-home-2026-07-05.orig.html',encoding='utf-8').read()
s=src
# 1. Fix trashed cert-recommender URL (3 places) -> new canonical page
n_cert = s.count('/assessments/cert-recommender/')
s=s.replace('/assessments/cert-recommender/','/cert-recommender/')
# 2. Message pivot: all HubSpot meeting links -> /about/#message
n_hub = s.count('https://meetings.hubspot.com/john2795')
s=s.replace('https://meetings.hubspot.com/john2795','/about/#message')
# 3. Hard numbers: replace redundant "2,500+ certified" trust item with "500+ cohorts delivered"
before='<span><strong>2,500+</strong> certified</span>'
assert before in s, "trust item not found"
s=s.replace(before,'<span><strong>500+</strong> live cohorts delivered</span>')
# 4. Org schema description + hero sub: add cohorts figure (canonical 500+)
s=s.replace(
'Trusted by 2,500+ professionals across 9 languages and 4 continents.',
'Trusted by 2,500+ professionals across 9 languages and 4 continents, with 500+ live cohorts delivered.')
s=s.replace(
'Trusted by 2,500+ professionals to get certified, hired, and promoted — across 9 languages and 4 continents.',
'Trusted by 2,500+ professionals to get certified, hired, and promoted — across 9 languages, 4 continents, and 500+ live cohorts delivered.')
# 5. Client names in crawlable text under the "Why Us" H2
why_h2='<h2 style="font-size:34px;font-weight:800;color:#053947;line-height:1.2;margin:14px 0 12px">Why Fortune 500s, government agencies, and 2,500+ professionals choose us</h2>\n</div>'
assert why_h2 in s, "why h2 not found"
s=s.replace(why_h2, why_h2.replace('</div>',
'<p style="font-size:16px;color:#475569;line-height:1.55;max-width:820px;margin:10px auto 0">Trusted to train and certify teams at IBM, TD Bank, Accenture, Deloitte, McKinsey, KPMG, the U.S. Air Force, and Canadian federal and provincial governments — 500+ live cohorts delivered across 9 languages and 4 continents.</p>\n</div>'))
open('/home/user/test/backups/961-home-2026-07-05.new.html','w',encoding='utf-8').write(s)
print(json.dumps({"cert_recommender_fixed":n_cert,"hubspot_pivoted":n_hub,
"hubspot_left":s.count('meetings.hubspot.com'),
"cohorts_added":s.count('500+'),"len_before":len(src),"len_after":len(s)}))
